/* eslint-disable sonarjs/no-collapsible-if */
type EnterpriseModuleStub = {
    type: 'axis' | 'axis-option' | 'series' | 'series-option' | 'root' | 'legend';
    packageType?: 'enterprise';
    identifier?: string;
    optionsKey: string;
    chartTypes: ('cartesian' | 'polar' | 'hierarchy')[];
    useCount?: number;
    optionsInnerKey?: string;
};

export const EXPECTED_ENTERPRISE_MODULES: EnterpriseModuleStub[] = [
    { type: 'root', optionsKey: 'animation', chartTypes: ['cartesian', 'polar', 'hierarchy'] },
    {
        type: 'root',
        optionsKey: 'background',
        chartTypes: ['cartesian', 'polar', 'hierarchy'],
        optionsInnerKey: 'image',
    },
    { type: 'root', optionsKey: 'contextMenu', chartTypes: ['cartesian', 'polar', 'hierarchy'] },
    { type: 'root', optionsKey: 'sync', chartTypes: ['cartesian'] },
    { type: 'root', optionsKey: 'zoom', chartTypes: ['cartesian'] },
    {
        type: 'legend',
        optionsKey: 'gradientLegend',
        chartTypes: ['cartesian', 'polar', 'hierarchy'],
        identifier: 'gradient',
    },
    { type: 'axis', optionsKey: 'axes[]', chartTypes: ['polar'], identifier: 'angle-category' },
    { type: 'axis', optionsKey: 'axes[]', chartTypes: ['polar'], identifier: 'angle-number' },
    { type: 'axis', optionsKey: 'axes[]', chartTypes: ['polar'], identifier: 'radius-category' },
    { type: 'axis', optionsKey: 'axes[]', chartTypes: ['polar'], identifier: 'radius-number' },
    { type: 'axis-option', optionsKey: 'crosshair', chartTypes: ['cartesian'] },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'box-plot' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'bullet' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'heatmap' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['polar'], identifier: 'nightingale' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['polar'], identifier: 'radar-area' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['polar'], identifier: 'radar-line' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['polar'], identifier: 'radial-bar' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['polar'], identifier: 'radial-column' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'range-area' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'range-bar' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['hierarchy'], identifier: 'sunburst' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['hierarchy'], identifier: 'treemap' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'waterfall' },
    { type: 'series-option', optionsKey: 'errorBar', chartTypes: ['cartesian'], identifier: 'error-bars' },
];

export function isEnterpriseSeriesType(type: string) {
    return EXPECTED_ENTERPRISE_MODULES.some((s) => s.type === 'series' && s.identifier === type);
}

export function getEnterpriseSeriesChartTypes(type: string) {
    return EXPECTED_ENTERPRISE_MODULES.find((s) => s.type === 'series' && s.identifier === type)?.chartTypes;
}

export function isEnterpriseSeriesTypeLoaded(type: string) {
    return (EXPECTED_ENTERPRISE_MODULES.find((s) => s.type === 'series' && s.identifier === type)?.useCount ?? 0) > 0;
}

export function isEnterpriseCartesian(seriesType: string) {
    const type = getEnterpriseSeriesChartTypes(seriesType)?.find((v) => v === 'cartesian');
    return type === 'cartesian';
}
export function isEnterprisePolar(seriesType: string) {
    const type = getEnterpriseSeriesChartTypes(seriesType)?.find((v) => v === 'polar');
    return type === 'polar';
}
export function isEnterpriseHierarchy(seriesType: string) {
    const type = getEnterpriseSeriesChartTypes(seriesType)?.find((v) => v === 'hierarchy');
    return type === 'hierarchy';
}

type UnknownPackage = { packageType: string } | EnterpriseModuleStub;
function isEnterpriseModule(module: UnknownPackage): module is EnterpriseModuleStub {
    return module.packageType === 'enterprise';
}

export function verifyIfModuleExpected(module: UnknownPackage) {
    if (!isEnterpriseModule(module)) {
        throw new Error('AG Charts - internal configuration error, only enterprise modules need verification.');
    }

    const stub = EXPECTED_ENTERPRISE_MODULES.find((s) => {
        return (
            s.type === module.type &&
            s.optionsKey === module.optionsKey &&
            s.identifier === module.identifier &&
            module.chartTypes.every((t) => s.chartTypes.includes(t))
        );
    });

    if (stub) {
        stub.useCount ??= 0;
        stub.useCount++;
    }

    return stub != null;
}

export function getUnusedExpectedModules() {
    return EXPECTED_ENTERPRISE_MODULES.filter(({ useCount }) => useCount == null || useCount === 0);
}
