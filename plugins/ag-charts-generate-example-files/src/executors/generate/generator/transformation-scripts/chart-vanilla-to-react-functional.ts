import { toTitleCase } from './angular-utils';
import { getChartImports, wrapOptionsUpdateCode } from './chart-utils';
import { convertFunctionToProperty, isInstanceMethod } from './parser-utils';
import { convertFunctionToConstCallback, convertFunctionalTemplate, getImport, styleAsObject } from './react-utils';

export function processFunction(code: string): string {
    return wrapOptionsUpdateCode(
        convertFunctionToProperty(code),
        'const clone = {...options};',
        'setOptions(clone);',
        'clone'
    );
}

function getImports(componentFilenames: string[], bindings): string[] {
    const useCallback = bindings.externalEventHandlers?.length + bindings.instanceMethods?.length > 0;

    const reactImports = ['Fragment', 'useState'];
    if (useCallback) reactImports.push('useCallback');
    if (bindings.usesChartApi) reactImports.push('useRef');

    const imports = [
        `import React, { ${reactImports.join(', ')} } from 'react';`,
        `import { createRoot } from 'react-dom/client';`,
        `import { AgChartsReact } from 'ag-charts-react';`,
    ];

    const chartImport = getChartImports(bindings.imports, bindings.usesChartApi);
    if (chartImport) {
        imports.push(chartImport);
    }

    if (componentFilenames) {
        imports.push(...componentFilenames.map(getImport));
    }

    if (bindings.chartSettings.enterprise) {
        imports.push(`import 'ag-charts-enterprise';`);
    }

    return imports;
}

function getAgChartTag(bindings: any, componentAttributes: string[]): string {
    return `<AgChartsReact
        ${bindings.usesChartApi ? 'ref={chartRef}' : ''}
        ${componentAttributes.join(`
        `)}
    />`;
}

function getTemplate(bindings: any, componentAttributes: string[]): string {
    const agChartTag = getAgChartTag(bindings, componentAttributes);

    let template: string = bindings.template ?? agChartTag;
    Object.values(bindings.placeholders).forEach((placeholder: string) => {
        template = template.replace(placeholder, agChartTag);
    });

    return convertFunctionalTemplate(template);
}

function getComponentMetadata(property: any) {
    const stateProperties = [];
    const componentAttributes = [];

    stateProperties.push(`const [${property.name}, set${toTitleCase(property.name)}] = useState(${property.value});`);
    componentAttributes.push(`options={${property.name}}`);

    return {
        stateProperties,
        componentAttributes,
    };
}

export async function vanillaToReactFunctional(bindings: any, componentFilenames: string[]): Promise<string> {
    const { properties } = bindings;
    const imports = getImports(componentFilenames, bindings);
    const placeholders = Object.keys(bindings.placeholders);

    let indexFile: string;

    if (placeholders.length <= 1) {
        const { stateProperties, componentAttributes } = getComponentMetadata(
            properties.find((p) => p.name === 'options')
        );

        const template = getTemplate(bindings, componentAttributes);

        const externalEventHandlers = bindings.externalEventHandlers.map((handler) =>
            processFunction(convertFunctionToConstCallback(handler.body, bindings.callbackDependencies))
        );
        const instanceMethods = bindings.instanceMethods.map((m) =>
            processFunction(convertFunctionToConstCallback(m, bindings.callbackDependencies))
        );

        indexFile = `
            ${imports.join(`
            `)}

            ${bindings.globals.join(`
            `)}

            const ChartExample = () => {
                ${bindings.usesChartApi ? `const chartRef = useRef(null);` : ''}
                ${stateProperties.join(',\n            ')}

                ${instanceMethods.concat(externalEventHandlers).join('\n\n    ')}

                return ${template};
            }

            const root = createRoot(document.getElementById('root'));
            root.render(<ChartExample />);
            `;
    } else {
        const components: string[] = [];
        indexFile = `
            ${imports.join(`
            `)}

            ${bindings.globals.join(`
            `)}
        `;

        placeholders.forEach((id) => {
            const componentName = toTitleCase(id);

            const propertyName = bindings.chartProperties[id];
            const { stateProperties, componentAttributes } = getComponentMetadata(
                properties.find((p) => p.name === propertyName)
            );

            Object.entries(bindings.chartAttributes[id]).forEach(([key, value]) => {
                if (key === 'style') {
                    componentAttributes.push(`containerStyle={${JSON.stringify(styleAsObject(value as any))}}`);
                } else {
                    throw new Error(`Unknown chart attribute: ${key}`);
                }
            });

            indexFile = `${indexFile}

            const ${componentName} = () => {
                ${stateProperties.join(`;
                `)}

                return ${getAgChartTag(bindings, componentAttributes)};
            }`;

            components.push(`<${componentName} />`);
        });

        indexFile = `${indexFile}

        const root = createRoot(document.getElementById('root'));
        root.render(
            <Fragment>
                ${components.join(`
                `)}
            </Fragment>
        );
        `;
    }

    if (bindings.usesChartApi) {
        indexFile = indexFile.replace(/AgCharts.(\w*)\((\w*)(,|\))/g, 'AgCharts.$1(chartRef.current.chart$3');
        indexFile = indexFile.replace(/\(this.chartRef.current.chart, options/g, '(chartRef.current.chart, options');
    }

    return indexFile;
}
