import { Debug } from '../../util/debug';
import { iterate } from '../../util/iterator';
import { Logger } from '../../util/logger';
import { isNegative } from '../../util/number';
import { isFiniteNumber, isObject } from '../../util/type-guards';
import type { ChartMode } from '../chartMode';
import { ContinuousDomain, DiscreteDomain, type IDataDomain } from './dataDomain';

export type ScopeProvider = { id: string };

export type UngroupedDataItem<D, V> = {
    keys: any[];
    values: V;
    aggValues?: [number, number][];
    datum: D;
    validScopes?: Set<string>;
};

export interface UngroupedData<D> {
    type: 'ungrouped';
    input: { count: number };
    data: UngroupedDataItem<D, any[]>[];
    domain: {
        keys: any[][];
        values: any[][];
        groups?: any[][];
        aggValues?: [number, number][];
    };
    reduced?: {
        diff?: ProcessedOutputDiff;
        smallestKeyInterval?: number;
        largestKeyInterval?: number;
        sortedGroupDomain?: any[][];
        animationValidation?: {
            uniqueKeys: boolean;
            orderedKeys: boolean;
        };
    };
    defs: {
        keys: DatumPropertyDefinition<keyof D>[];
        values: DatumPropertyDefinition<keyof D>[];
        allScopesHaveSameDefs: boolean;
    };
    partialValidDataCount: number;
    time: number;
}

export type ProcessedOutputDiff = {
    changed: boolean;
    added: Map<string, any>;
    updated: Map<string, any>;
    removed: Map<string, any>;
    moved: Map<string, any>;
};

export type GroupedDataItem<D> = UngroupedDataItem<D[], any[][]> & { area?: number };

export interface ProcessedDataDef {
    index: number;
    def: PropertyDefinition<any>;
}

export interface GroupedData<D> {
    type: 'grouped';
    input: UngroupedData<D>['input'];
    data: GroupedDataItem<D>[];
    domain: UngroupedData<D>['domain'];
    reduced?: UngroupedData<D>['reduced'];
    defs: UngroupedData<D>['defs'];
    partialValidDataCount: number;
    time: number;
}

export type ProcessedData<D> = UngroupedData<D> | GroupedData<D>;

export type DatumPropertyType = 'range' | 'category';

function toKeyString(keys: any[]) {
    return keys.map((key) => (isObject(key) ? JSON.stringify(key) : key)).join('-');
}

function round(val: number): number {
    const accuracy = 10000;
    if (Number.isInteger(val)) {
        return val;
    } else if (Math.abs(val) > accuracy) {
        return Math.trunc(val);
    }

    return Math.round(val * accuracy) / accuracy;
}

export function fixNumericExtent(extent: Array<number | Date> | null): [] | [number, number] {
    if (extent == null) {
        return [];
    }
    const [min, max] = extent.map(Number);
    // If domain has a single valid value, 0, use the default extent of [0, 1].
    if (min === 0 && max === 0) {
        return [0, 1];
    }
    return isFiniteNumber(min) && isFiniteNumber(max) ? [min, max] : [];
}

// AG-10337 Keep track of the number of missing values in each per-series data array.
type MissMap = Map<string | undefined, number>;

export function getMissCount(scopeProvider: ScopeProvider, missMap: MissMap | undefined) {
    return missMap?.get(scopeProvider.id) ?? 0;
}

type GroupingFn<K> = (data: UngroupedDataItem<K, any[]>) => K[];
export type GroupByFn = (extractedData: UngroupedData<any>) => GroupingFn<any>;
export type DataModelOptions<K, Grouped extends boolean | undefined> = {
    scopes?: string[];
    props: PropertyDefinition<K>[];
    groupByKeys?: Grouped;
    groupByData?: Grouped;
    groupByFn?: GroupByFn;
};

export type PropertyDefinition<K> =
    | DatumPropertyDefinition<K>
    | AggregatePropertyDefinition<any, any, any>
    | PropertyValueProcessorDefinition<any>
    | GroupValueProcessorDefinition<any, any>
    | ReducerOutputPropertyDefinition<any>
    | ProcessorOutputPropertyDefinition<any>;

export type ProcessorFn = (datum: any, previousDatum?: any) => any;
export type PropertyId<K extends string> = K | { id: string };

type PropertyIdentifiers = {
    /** Scope(s) a property definition belongs to (typically the defining entities unique identifier). */
    scopes?: string[];
    id?: string;
    /** Map<Scope, Set<Id>> */
    idsMap?: Map<string, Set<string>>;
    /** Optional group a property belongs to, for cross-scope combination. */
    groupId?: string;
};

type PropertySelectors = {
    /** Optional group a property belongs to, for cross-scope combination. */
    matchGroupIds?: string[];
};

export type DatumPropertyDefinition<K> = PropertyIdentifiers & {
    type: 'key' | 'value';
    valueType: DatumPropertyType;
    property: K;
    forceValue?: any;
    includeProperty?: boolean;
    invalidValue?: any;
    missing?: MissMap;
    missingValue?: any;
    separateNegative?: boolean;
    validation?: (value: any, datum: any, index: number) => boolean;
    processor?: () => ProcessorFn;
};

type InternalDefinition = {
    index: number;
};

type InternalDatumPropertyDefinition<K> = DatumPropertyDefinition<K> &
    InternalDefinition & {
        missing: MissMap;
    };

export type AggregatePropertyDefinition<
    D,
    K extends keyof D & string,
    R = [number, number],
    R2 = R,
> = PropertyIdentifiers &
    PropertySelectors & {
        type: 'aggregate';
        aggregateFunction: (values: D[K][], keys?: D[K][]) => R;
        groupAggregateFunction?: (next?: R, acc?: R2) => R2;
        finalFunction?: (result: R2) => [number, number];
    };

export type GroupValueProcessorDefinition<D, K extends keyof D & string> = PropertyIdentifiers &
    PropertySelectors & {
        type: 'group-value-processor';
        /**
         * Outer function called once per all data processing; inner function called once per group;
         * innermost called once per datum.
         */
        adjust: () => () => (values: D[K][], indexes: number[]) => void;
    };

export type PropertyValueProcessorDefinition<D> = PropertyIdentifiers & {
    type: 'property-value-processor';
    property: string;
    adjust: () => (processedData: ProcessedData<D>, valueIndex: number) => void;
};

type ReducerOutputTypes = NonNullable<UngroupedData<any>['reduced']>;
type ReducerOutputKeys = keyof ReducerOutputTypes;
export type ReducerOutputPropertyDefinition<P extends ReducerOutputKeys = ReducerOutputKeys> = PropertyIdentifiers & {
    type: 'reducer';
    property: P;
    initialValue?: ReducerOutputTypes[P];
    reducer: () => (acc: ReducerOutputTypes[P], next: UngroupedDataItem<any, any>) => ReducerOutputTypes[P];
};

export type ProcessorOutputPropertyDefinition<P extends ReducerOutputKeys = ReducerOutputKeys> = PropertyIdentifiers & {
    type: 'processor';
    property: P;
    calculate: (data: ProcessedData<any>) => ReducerOutputTypes[P];
};

const INVALID_VALUE = Symbol('invalid');

export function getPathComponents(path: string) {
    const components: string[] = [];
    let matchIndex = 0;
    let matchGroup: RegExpExecArray | null;
    // This regex is a slightly less correct version of the commented out version below
    // Safari <16.4 does not support negative look behinds
    // Look at the skipped tests for what cases are not supported by this version
    const regExp = /((?:(?:^|\.)\s*\w+|\[\s*(?:'(?:[^']|\\')*'|"(?:[^"]|\\")*"|-?\d+)\s*\])\s*)/g;
    /*
    const regExp = /((?:(?:^|\.)\s*\w+|\[\s*(?:'(?:[^']|(?<!\\)\\')*'|"(?:[^"]|(?<!\\)\\")*"|-?\d+)\s*\])\s*)/g;
    */
    /**              ^                         ^                      ^                      ^
     *               |                         |                      |                      |
     *                - .dotAccessor or initial property (i.e. a in "a.b")                   |
     *                                         |                      |                      |
     *                                          - ['single-quoted']                          |
     *                                                                |                      |
     *                                                                 - ["double-quoted"]   |
     *                                                                                       |
     *                                                                                        - [0] index properties
     */
    while ((matchGroup = regExp.exec(path))) {
        if (matchGroup.index !== matchIndex) {
            return;
        }
        matchIndex = matchGroup.index + matchGroup[0].length;
        const match = matchGroup[1].trim();
        if (match.startsWith('.')) {
            // .property
            components.push(match.slice(1).trim());
        } else if (match.startsWith('[')) {
            const accessor = match.slice(1, -1).trim();
            if (accessor.startsWith(`'`)) {
                // ['string-property']
                // See Safari <16.4 note above
                components.push(accessor.slice(1, -1).replace(/\\'/g, `'`));
                // components.push(accessor.slice(1, -1).replace(/(?<!\\)\\'/g, `'`));
            } else if (accessor.startsWith(`"`)) {
                // ["string-property"]
                // See Safari <16.4 note above
                components.push(accessor.slice(1, -1).replace(/\\"/g, `"`));
                // components.push(accessor.slice(1, -1).replace(/(?<!\\)\\"/g, `"`));
            } else {
                // ["number-property"]
                components.push(accessor);
            }
        } else {
            // thisProperty.other["properties"]['afterwards']
            components.push(match);
        }
    }

    if (matchIndex !== path.length) return;

    return components;
}

function createPathAccessor(components: string[]) {
    return (datum: any): any => {
        let current = datum;
        for (const component of components) {
            current = current[component];
        }
        return current;
    };
}

export class DataModel<
    D extends object,
    K extends keyof D & string = keyof D & string,
    Grouped extends boolean | undefined = undefined,
> {
    private readonly debug = Debug.create(true, 'data-model');
    private readonly scopeCache: Map<string, Map<string, PropertyDefinition<any> & InternalDefinition>> = new Map();

    private readonly keys: InternalDatumPropertyDefinition<K>[] = [];
    private readonly values: InternalDatumPropertyDefinition<K>[] = [];
    private readonly aggregates: (AggregatePropertyDefinition<D, K> & InternalDefinition)[] = [];
    private readonly groupProcessors: (GroupValueProcessorDefinition<D, K> & InternalDefinition)[] = [];
    private readonly propertyProcessors: (PropertyValueProcessorDefinition<D> & InternalDefinition)[] = [];
    private readonly reducers: (ReducerOutputPropertyDefinition & InternalDefinition)[] = [];
    private readonly processors: (ProcessorOutputPropertyDefinition & InternalDefinition)[] = [];

    public constructor(
        private readonly opts: DataModelOptions<K, Grouped>,
        private readonly mode: ChartMode = 'standalone'
    ) {
        // Validate that keys appear before values in the definitions, as output ordering depends
        // on configuration ordering, but we process keys before values.
        let keys = true;
        for (const next of opts.props) {
            if (next.type === 'key' && !keys) {
                throw new Error('AG Charts - internal config error: keys must come before values.');
            }
            if (next.type === 'value' && keys) {
                keys = false;
            }
        }

        const verifyMatchGroupId = ({ matchGroupIds = [] }: { matchGroupIds?: string[] }) => {
            for (const matchGroupId of matchGroupIds) {
                if (this.values.every((def) => def.groupId !== matchGroupId)) {
                    throw new Error(
                        `AG Charts - internal config error: matchGroupIds properties must match defined groups (${matchGroupId}).`
                    );
                }
            }
        };

        for (const def of opts.props) {
            switch (def.type) {
                case 'key':
                    this.keys.push({ ...def, index: this.keys.length, missing: new Map() });
                    break;

                case 'value':
                    if (def.property == null) {
                        throw new Error(
                            `AG Charts - internal config error: no properties specified for value definitions: ${JSON.stringify(
                                def
                            )}`
                        );
                    }
                    this.values.push({ ...def, index: this.values.length, missing: new Map() });
                    break;

                case 'aggregate':
                    verifyMatchGroupId(def);
                    this.aggregates.push({ ...def, index: this.aggregates.length });
                    break;

                case 'group-value-processor':
                    verifyMatchGroupId(def);
                    this.groupProcessors.push({ ...def, index: this.groupProcessors.length });
                    break;

                case 'property-value-processor':
                    this.propertyProcessors.push({ ...def, index: this.propertyProcessors.length });
                    break;

                case 'reducer':
                    this.reducers.push({ ...def, index: this.reducers.length });
                    break;

                case 'processor':
                    this.processors.push({ ...def, index: this.processors.length });
                    break;
            }
        }
    }

    resolveProcessedDataDefById(scope: ScopeProvider, searchId: string): ProcessedDataDef | never {
        const def = this.scopeCache.get(scope.id)?.get(searchId);

        if (!def) {
            throw new Error(`AG Charts - didn't find property definition for [${searchId}, ${scope.id}]`);
        }

        return { index: def.index, def };
    }

    resolveProcessedDataIndexById(scope: ScopeProvider, searchId: string): number {
        return this.resolveProcessedDataDefById(scope, searchId).index;
    }

    resolveProcessedDataDefsByIds<T extends string>(scope: ScopeProvider, searchIds: T[]): [T, ProcessedDataDef][] {
        return searchIds.map((searchId) => [searchId, this.resolveProcessedDataDefById(scope, searchId)]);
    }

    resolveProcessedDataDefsValues<T extends string>(
        defs: [T, ProcessedDataDef][],
        { keys, values }: { keys: unknown[]; values: unknown[] }
    ): Record<T, any> {
        const result: Record<string, any> = {};
        for (const [searchId, { index, def }] of defs) {
            const processedData = def.type === 'key' ? keys : values;
            result[searchId] = processedData[index];
        }
        return result;
    }

    getDomain(
        scope: ScopeProvider,
        searchId: string,
        type: PropertyDefinition<any>['type'] = 'value',
        processedData: ProcessedData<K>
    ): any[] | [number, number] | [] {
        const domains = this.getDomainsByType(type, processedData);
        return domains?.[this.resolveProcessedDataIndexById(scope, searchId)] ?? [];
    }

    private getDomainsByType(type: PropertyDefinition<any>['type'], processedData: ProcessedData<K>) {
        switch (type) {
            case 'key':
                return processedData.domain.keys;
            case 'value':
                return processedData.domain.values;
            case 'aggregate':
                return processedData.domain.aggValues;
            case 'group-value-processor':
                return processedData.domain.groups;
            default:
                return null;
        }
    }

    processData(
        data: D[],
        sources?: { id: string; data: D[] }[]
    ): (Grouped extends true ? GroupedData<D> : UngroupedData<D>) | undefined {
        const {
            opts: { groupByKeys, groupByFn },
            aggregates,
            groupProcessors,
            reducers,
            processors,
            propertyProcessors,
        } = this;
        const start = performance.now();

        if (groupByKeys && this.keys.length === 0) {
            return;
        }

        let processedData: ProcessedData<D> = this.extractData(data, sources);
        if (groupByKeys) {
            processedData = this.groupData(processedData);
        } else if (groupByFn) {
            processedData = this.groupData(processedData, groupByFn(processedData));
        }
        if (groupProcessors.length > 0) {
            this.postProcessGroups(processedData);
        }
        if (aggregates.length > 0) {
            this.aggregateData(processedData);
        }
        if (propertyProcessors.length > 0) {
            this.postProcessProperties(processedData);
        }
        if (reducers.length > 0) {
            this.reduceData(processedData);
        }
        if (processors.length > 0) {
            this.postProcessData(processedData);
        }

        this.warnDataMissingProperties(data);

        const end = performance.now();
        processedData.time = end - start;

        if (this.debug.check()) {
            logProcessedData(processedData);
        }

        this.processScopeCache();

        return processedData as Grouped extends true ? GroupedData<D> : UngroupedData<D>;
    }

    private warnDataMissingProperties(data: D[]) {
        if (data.length === 0) return;

        for (const def of iterate(this.keys, this.values)) {
            for (const [scope, missCount] of def.missing) {
                if (missCount < data.length) continue;
                const scopeHint = scope == null ? '' : ` for ${scope}`;
                Logger.warnOnce(`the key '${def.property}' was not found in any data element${scopeHint}.`);
            }
        }
    }

    private processScopeCache() {
        this.scopeCache.clear();
        for (const def of iterate(this.keys, this.values, this.aggregates)) {
            if (!def.idsMap) continue;
            for (const [scope, ids] of def.idsMap) {
                for (const id of ids) {
                    if (!this.scopeCache.has(scope)) {
                        this.scopeCache.set(scope, new Map([[id, def]]));
                    } else if (this.scopeCache.get(scope)?.has(id)) {
                        throw new Error('duplicate definition ids on the same scope are not allowed.');
                    } else {
                        this.scopeCache.get(scope)!.set(id, def);
                    }
                }
            }
        }
    }

    private valueGroupIdxLookup({ matchGroupIds }: PropertySelectors) {
        const result: number[] = [];
        for (const [index, def] of this.values.entries()) {
            if (!matchGroupIds || (def.groupId && matchGroupIds.includes(def.groupId))) {
                result.push(index);
            }
        }
        return result;
    }

    private valueIdxLookup(scopes: string[] | undefined, prop: PropertyId<string>) {
        const noScopesToMatch = scopes == null || scopes.length === 0;
        const propId = typeof prop === 'string' ? prop : prop.id;

        const hasMatchingScopeId = (def: InternalDatumPropertyDefinition<K>) => {
            if (def.idsMap) {
                for (const [scope, ids] of def.idsMap) {
                    if (scopes?.includes(scope) && ids.has(propId)) {
                        return true;
                    }
                }
            }
            return false;
        };

        const result = this.values.findIndex((def) => {
            const validDefScopes =
                def.scopes == null ||
                (noScopesToMatch && !def.scopes.length) ||
                def.scopes.some((s) => scopes?.includes(s));

            return validDefScopes && (def.property === propId || def.id === propId || hasMatchingScopeId(def));
        });

        if (result === -1) {
            throw new Error(
                `AG Charts - configuration error, unknown property ${JSON.stringify(prop)} in scope(s) ${JSON.stringify(
                    scopes
                )}`
            );
        }

        return result;
    }

    private extractData(data: D[], sources?: { id: string; data: D[] }[]): UngroupedData<D> {
        const { dataDomain, processValue, scopes, allScopesHaveSameDefs } = this.initDataDomainProcessor();
        const sourcesById = new Map(sources?.map((s) => [s.id, s]));
        const { keys: keyDefs, values: valueDefs } = this;
        const resultData = new Array(data.length);

        let resultDataIdx = 0;
        let partialValidDataCount = 0;

        for (const [datumIdx, datum] of data.entries()) {
            const sourceDatums: Record<string, any> = {};

            const validScopes = scopes.size > 0 ? new Set(scopes) : undefined;
            const keys = new Array(keyDefs.length);
            let keyIdx = 0;
            let key;
            for (const def of keyDefs) {
                key = processValue(def, datum, datumIdx, key);
                if (key === INVALID_VALUE) break;
                if (keys) {
                    keys[keyIdx++] = key;
                }
            }
            if (key === INVALID_VALUE) continue;

            const values = valueDefs.length > 0 ? new Array(valueDefs.length) : undefined;
            let value;

            for (const [valueDefIdx, def] of valueDefs.entries()) {
                for (const scope of def.scopes ?? scopes) {
                    const source = sourcesById.get(scope);
                    const valueDatum = source?.data[datumIdx] ?? datum;

                    value = processValue(def, valueDatum, datumIdx, value, scope);

                    if (value === INVALID_VALUE || !values) continue;

                    if (source != null && def.includeProperty !== false) {
                        const property = def.includeProperty && def.id != null ? def.id : def.property;
                        sourceDatums[scope] ??= {};
                        sourceDatums[scope][property] = value;
                    }

                    values[valueDefIdx] = value;
                }

                if (value === INVALID_VALUE) {
                    if (allScopesHaveSameDefs) break;
                    for (const scope of def.scopes ?? scopes) {
                        validScopes?.delete(scope);
                    }
                    if (validScopes?.size === 0) break;
                }
            }

            if (value === INVALID_VALUE && allScopesHaveSameDefs) continue;
            if (validScopes?.size === 0) continue;

            const result: UngroupedDataItem<D, any> = { datum: { ...datum, ...sourceDatums }, keys, values };

            if (!allScopesHaveSameDefs && validScopes && validScopes.size < scopes.size) {
                partialValidDataCount++;
                result.validScopes = new Set(validScopes);
            }

            resultData[resultDataIdx++] = result;
        }
        resultData.length = resultDataIdx;

        const propertyDomain = (def: InternalDatumPropertyDefinition<K>) => {
            const defDomain = dataDomain.get(def)!;
            const result = defDomain.getDomain();
            // Ignore starting values.
            if (ContinuousDomain.is(defDomain) && result[0] > result[1]) {
                return [];
            }
            return result;
        };

        return {
            type: 'ungrouped',
            input: { count: data.length },
            data: resultData,
            domain: {
                keys: keyDefs.map(propertyDomain),
                values: valueDefs.map(propertyDomain),
            },
            defs: {
                allScopesHaveSameDefs,
                keys: keyDefs,
                values: valueDefs,
            },
            partialValidDataCount,
            time: 0,
        };
    }

    private groupData(data: UngroupedData<D>, groupingFn?: GroupingFn<D>): GroupedData<D> {
        const processedData = new Map<
            string,
            { keys: D[K][]; values: D[K][][]; datum: D[]; validScopes?: Set<string> }
        >();

        for (const dataEntry of data.data) {
            const { keys, values, datum, validScopes } = dataEntry;
            const group = groupingFn?.(dataEntry) ?? keys;
            const groupStr = toKeyString(group);

            if (processedData.has(groupStr)) {
                const existingData = processedData.get(groupStr)!;
                existingData.values.push(values);
                existingData.datum.push(datum);
                if (validScopes != null && existingData.validScopes != null) {
                    // Intersection of existing validScopes with new validScopes.
                    for (const scope of existingData.validScopes) {
                        if (!validScopes.has(scope)) {
                            existingData.validScopes.delete(scope);
                        }
                    }
                }
            } else {
                processedData.set(groupStr, {
                    keys: group,
                    values: [values],
                    datum: [datum],
                    validScopes,
                });
            }
        }

        const resultData = new Array(processedData.size);
        const resultGroups = new Array(processedData.size);
        let dataIndex = 0;
        for (const { keys, values, datum, validScopes } of processedData.values()) {
            if (validScopes?.size === 0) continue;

            resultGroups[dataIndex] = keys;
            resultData[dataIndex++] = {
                keys,
                values,
                datum,
                validScopes,
            };
        }

        return {
            ...data,
            type: 'grouped',
            data: resultData,
            domain: {
                ...data.domain,
                groups: resultGroups,
            },
        };
    }

    private aggregateData(processedData: ProcessedData<any>) {
        const isUngrouped = processedData.type === 'ungrouped';

        processedData.domain.aggValues = [];

        for (const [index, def] of this.aggregates.entries()) {
            const indices = this.valueGroupIdxLookup(def);
            const domain: [number, number] = [Infinity, -Infinity];

            for (const datum of processedData.data) {
                datum.aggValues ??= new Array(this.aggregates.length);

                if (datum.validScopes) continue;

                const values = isUngrouped ? [datum.values] : datum.values;
                let groupAggValues = def.groupAggregateFunction?.() ?? [Infinity, -Infinity];

                for (const distinctValues of values) {
                    const valuesToAgg = indices.map((valueIdx) => distinctValues[valueIdx] as D[K]);
                    const valuesAgg = def.aggregateFunction(valuesToAgg, datum.keys);
                    if (valuesAgg) {
                        groupAggValues =
                            def.groupAggregateFunction?.(valuesAgg, groupAggValues) ??
                            ContinuousDomain.extendDomain(valuesAgg, groupAggValues);
                    }
                }

                const finalValues = (def.finalFunction?.(groupAggValues) ?? groupAggValues).map((v) => round(v)) as [
                    number,
                    number,
                ];

                datum.aggValues[index] = finalValues;
                ContinuousDomain.extendDomain(finalValues, domain);
            }

            processedData.domain.aggValues.push(domain);
        }
    }

    private postProcessGroups(processedData: ProcessedData<any>) {
        const { groupProcessors } = this;
        const affectedIndices = new Set<number>();
        const updatedDomains = new Map<number, IDataDomain>();
        const groupProcessorIndices = new Map<object, number[]>();
        const groupProcessorInitFns = new Map<object, () => (v: any[], i: number[]) => void>();

        for (const processor of groupProcessors) {
            const indices = this.valueGroupIdxLookup(processor);
            groupProcessorIndices.set(processor, indices);
            groupProcessorInitFns.set(processor, processor.adjust());

            for (const idx of indices) {
                const valueDef = this.values[idx];
                const isDiscrete = valueDef.valueType === 'category';
                affectedIndices.add(idx);
                updatedDomains.set(idx, isDiscrete ? new DiscreteDomain() : new ContinuousDomain());
            }
        }

        const updateDomains = (values: any[]) => {
            for (const valueIndex of affectedIndices) {
                updatedDomains.get(valueIndex)?.extend(values[valueIndex]);
            }
        };

        for (const group of processedData.data) {
            for (const processor of groupProcessors) {
                if (group.validScopes) continue;

                const valueIndexes = groupProcessorIndices.get(processor) ?? [];
                const adjustFn = groupProcessorInitFns.get(processor)?.();

                if (!adjustFn) continue;
                if (processedData.type === 'grouped') {
                    for (const values of group.values) {
                        if (values) {
                            adjustFn(values, valueIndexes);
                        }
                    }
                } else if (group.values) {
                    adjustFn(group.values, valueIndexes);
                }
            }

            if (processedData.type === 'grouped') {
                for (const values of group.values) {
                    updateDomains(values);
                }
            } else {
                updateDomains(group.values);
            }
        }

        for (const [idx, dataDomain] of updatedDomains) {
            processedData.domain.values[idx] = dataDomain.getDomain();
        }
    }

    private postProcessProperties(processedData: ProcessedData<any>) {
        for (const { adjust, property, scopes } of this.propertyProcessors) {
            adjust()(processedData, this.valueIdxLookup(scopes, property));
        }
    }

    private reduceData(processedData: ProcessedData<D>) {
        processedData.reduced ??= {};
        for (const def of this.reducers) {
            const reducer = def.reducer();
            let accValue: any = def.initialValue;
            for (const datum of processedData.data) {
                if (!datum.validScopes || def.scopes?.some((s) => datum.validScopes?.has(s))) {
                    accValue = reducer(accValue, datum);
                }
            }
            processedData.reduced[def.property] = accValue;
        }
    }

    private postProcessData(processedData: ProcessedData<D>) {
        processedData.reduced ??= {};
        for (const def of this.processors) {
            processedData.reduced[def.property] = def.calculate(processedData) as any;
        }
    }

    private initDataDomainProcessor() {
        const { keys: keyDefs, values: valueDefs } = this;

        const scopes = new Set<string>();
        for (const valueDef of valueDefs) {
            if (!valueDef.scopes) continue;
            for (const scope of valueDef.scopes) {
                scopes.add(scope);
            }
        }

        const dataDomain: Map<object, IDataDomain> = new Map();
        const processorFns = new Map<InternalDatumPropertyDefinition<K>, ProcessorFn>();
        let allScopesHaveSameDefs = true;

        const initDataDomain = () => {
            for (const def of iterate(keyDefs, valueDefs)) {
                if (def.valueType === 'category') {
                    dataDomain.set(def, new DiscreteDomain());
                } else {
                    dataDomain.set(def, new ContinuousDomain());
                    allScopesHaveSameDefs &&= (def.scopes ?? []).length === scopes.size;
                }
            }
        };
        initDataDomain();

        const accessors = this.buildAccessors(iterate(keyDefs, valueDefs));

        const processValue = (
            def: InternalDatumPropertyDefinition<K>,
            datum: any,
            idx: number,
            previousDatum?: any,
            scope?: string
        ) => {
            let valueInDatum: boolean;
            let value;
            if (accessors.has(def.property)) {
                try {
                    value = accessors.get(def.property)!(datum);
                } catch (error: any) {
                    // Swallow errors - these get reported as missing values to the user later.
                }
                valueInDatum = value != null;
            } else {
                valueInDatum = def.property in datum;
                value = valueInDatum ? datum[def.property] : def.missingValue;
            }

            if (def.forceValue != null) {
                // Maintain sign of forceValue from actual value, this maybe significant later when
                // we account for the value falling into positive/negative buckets.
                const valueNegative = valueInDatum && isNegative(value);
                value = valueNegative ? -1 * def.forceValue : def.forceValue;
                valueInDatum = true;
            }

            const missingValueDef = 'missingValue' in def;
            if (!valueInDatum && !missingValueDef) {
                const missCount = def.missing.get(scope) ?? 0;
                def.missing.set(scope, missCount + 1);
            }

            if (!dataDomain.has(def)) {
                initDataDomain();
            }

            if (valueInDatum && def.validation?.(value, datum, idx) === false) {
                if ('invalidValue' in def) {
                    value = def.invalidValue;
                } else {
                    if (this.mode !== 'integrated') {
                        Logger.warnOnce(
                            `invalid value of type [${typeof value}] for [${def.scopes} / ${def.id}] ignored:`,
                            `[${value}]`
                        );
                    }
                    return INVALID_VALUE;
                }
            }

            if (def.processor) {
                if (!processorFns.has(def)) {
                    processorFns.set(def, def.processor());
                }
                value = processorFns.get(def)?.(value, previousDatum === INVALID_VALUE ? undefined : previousDatum);
            }

            dataDomain.get(def)?.extend(value);
            return value;
        };

        return { dataDomain, processValue, initDataDomain, scopes, allScopesHaveSameDefs };
    }

    buildAccessors(defs: Iterable<{ property: string }>) {
        const result = new Map<string, (d: any) => any>();
        if (this.mode === 'integrated') {
            return result;
        }

        for (const def of defs) {
            const isPath = def.property.includes('.') || def.property.includes('[');
            if (!isPath) continue;

            const components = getPathComponents(def.property);
            if (components == null) {
                Logger.warnOnce('Invalid property path [%s]', def.property);
                continue;
            }
            const accessor = createPathAccessor(components);
            result.set(def.property, accessor);
        }
        return result;
    }
}

function logProcessedData(processedData: ProcessedData<any>) {
    const logValues = (name: string, data: any[]) => {
        if (data.length > 0) {
            Logger.log(`DataModel.processData() - ${name}`);
            Logger.table(data);
        }
    };

    Logger.log('DataModel.processData() - processedData', processedData);
    logValues('Key Domains', processedData.domain.keys);
    logValues('Group Domains', processedData.domain.groups ?? []);
    logValues('Value Domains', processedData.domain.values);
    logValues('Aggregate Domains', processedData.domain.aggValues ?? []);

    if (processedData.type === 'grouped') {
        const flattenedValues = processedData.data.reduce<any[]>((acc, next) => {
            const keys = next.keys ?? [];
            const aggValues = next.aggValues ?? [];
            const skipKeys = next.keys.map(() => undefined);
            const skipAggValues = aggValues?.map(() => undefined);
            acc.push(
                ...next.values.map((v, i) => [
                    ...(i === 0 ? keys : skipKeys),
                    ...(v ?? []),
                    ...(i == 0 ? aggValues : skipAggValues),
                ])
            );
            return acc;
        }, []);
        logValues('Values', flattenedValues);
    } else {
        const flattenedValues = processedData.data.reduce<any[]>((acc, next) => {
            const aggValues = next.aggValues ?? [];
            acc.push([...next.keys, ...next.values, ...aggValues]);
            return acc;
        }, []);
        logValues('Values', flattenedValues);
    }
}
