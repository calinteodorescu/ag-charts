export interface UngroupedData<D> {
    type: 'ungrouped';
    data: {
        keys: any[];
        values: any[];
        datum: D;
    }[];
    dataDomain: {
        keys: any[][];
        values: any[][];
    };
}

export interface GroupedData<D> {
    type: 'grouped';
    data: {
        keys: any[];
        values: any[][];
        datum: D[];
    }[];
    dataDomain: {
        keys: any[][];
        values: any[][];
        sumValues?: any[][];
    };
}

export interface AggregatedData<D> {
    type: 'aggregated';
    data: {
        keys: any[];
        values: any[];
        datum: D[];
    }[];
    dataDomain: {
        keys: any[][];
        values: any[][];
    };
}

export type ProcessedData<D> = UngroupedData<D> | GroupedData<D> | AggregatedData<D>;

export type DatumPropertyType = 'range' | 'category';

type ContinuousDomain<T extends number | Date> = [T, T];

function extendDomain<T extends number | Date>(
    values: T[],
    domain: ContinuousDomain<T> = [Infinity as T, -Infinity as T]
) {
    for (const value of values) {
        if (typeof value !== 'number') {
            continue;
        }

        if (value < domain[0]) {
            domain[0] = value;
        }
        if (value > domain[1]) {
            domain[1] = value;
        }
    }

    return domain;
}

function sumValues(values: any[]) {
    const accumulator = [0, 0] as ContinuousDomain<number>;
    for (const value of values) {
        if (typeof value !== 'number') {
            return;
        }
        if (value < 0) {
            accumulator[0] += value;
        }
        if (value > 0) {
            accumulator[1] += value;
        }
    }

    return accumulator;
}

type Options<K> = {
    readonly props: DatumPropertyDefinition<K>[];
    readonly groupByKeys?: boolean;
    readonly sumGroupDataDomains?: K[][];
};

export type DatumPropertyDefinition<K> = {
    type: 'key' | 'value';
    valueType: DatumPropertyType;
    property: K;
    validation?: (datum: any) => boolean;
};

type InternalDatumPropertyDefinition<K> = DatumPropertyDefinition<K> & { index: number };

export class DataModel<D extends object, K extends keyof D = keyof D> {
    private readonly opts: Options<K>;
    private readonly keys: InternalDatumPropertyDefinition<K>[];
    private readonly values: InternalDatumPropertyDefinition<K>[];

    public constructor(opts: Options<K>) {
        const { props } = opts;

        // Validate that keys appear before values in the definitions, as output ordering depends
        // on configuration ordering, but we process keys before values.
        let keys = true;
        for (const next of props) {
            if (next.type === 'key' && !keys) {
                throw new Error('AG Charts - internal config error: keys must come before values.');
            }
            if (next.type === 'value' && keys) {
                keys = false;
            }
        }

        this.opts = opts;
        this.keys = props.filter((def) => def.type === 'key').map((def, index) => ({ ...def, index }));
        this.values = props.filter((def) => def.type === 'value').map((def, index) => ({ ...def, index }));
    }

    processData(data: D[]): ProcessedData<D> {
        const { groupByKeys, sumGroupDataDomains } = this.opts;
        // TODO:
        // Validation.
        // Normalisation.

        let processedData: ProcessedData<D> = this.extractData(data);
        if (groupByKeys) {
            processedData = this.groupData(processedData);
        }
        if (sumGroupDataDomains) {
            processedData = this.sumData(processedData);
        }

        return processedData;
    }

    private extractData(data: D[]): UngroupedData<D> {
        const {
            opts: { props },
            keys: keyDefs,
            values: valueDefs,
        } = this;

        const { dataDomain, processValue } = this.initDataDomainProcessor();

        let resultData = data.map((datum) => ({
            datum,
            keys: keyDefs.map((def) => processValue(def.property, datum[def.property])),
            values: valueDefs.map((def) => processValue(def.property, datum[def.property])),
        }));

        if (props.some((def) => def.validation != null)) {
            resultData = resultData.filter(({ keys, values }) => {
                let idx = 0;
                for (const key of keys) {
                    const validator = keyDefs[idx++].validation;
                    if (validator && !validator(key)) {
                        return false;
                    }
                }
                idx = 0;
                for (const value of values) {
                    const validator = valueDefs[idx++].validation;
                    if (validator && !validator(value)) {
                        return false;
                    }
                }
                return true;
            });
        }

        return {
            type: 'ungrouped',
            data: resultData,
            dataDomain: {
                keys: keyDefs.map((def) => [...dataDomain.get(def.property)!.domain]),
                values: valueDefs.map((def) => [...dataDomain.get(def.property)!.domain]),
            },
        };
    }

    private groupData(data: UngroupedData<D>): GroupedData<D> {
        const processedData = new Map<string, { keys: D[K][]; values: D[K][][]; datum: D[] }>();

        for (const { keys, values, datum } of data.data) {
            const keyStr = keys.join('-');

            if (processedData.has(keyStr)) {
                const existingData = processedData.get(keyStr)!;
                existingData.values.push(values);
                existingData.datum.push(datum);
            } else {
                processedData.set(keyStr, { keys, values: [values], datum: [datum] });
            }
        }

        const resultData = new Array(processedData.size);
        let dataIndex = 0;
        for (const [, { keys, values, datum }] of processedData.entries()) {
            resultData[dataIndex++] = {
                keys,
                values,
                datum,
            };
        }

        return {
            ...data,
            type: 'grouped',
            data: resultData,
        };
    }

    private sumData<T extends ProcessedData<any>>(data: T): T {
        const {
            values: valueDefs,
            opts: { sumGroupDataDomains },
        } = this;

        if (!sumGroupDataDomains) {
            return data;
        }

        const resultSumValues = sumGroupDataDomains.map((): ContinuousDomain<number> => [Infinity, -Infinity]);
        const resultSumValueIndices = sumGroupDataDomains.map((props) =>
            props.map((prop) => valueDefs.findIndex((def) => def.property === prop))
        );

        for (let { values } of data.data) {
            if (data.type === 'ungrouped') {
                values = [values];
            }
            for (const distinctValues of values) {
                let resultIdx = 0;
                for (const indices of resultSumValueIndices) {
                    const valuesToSum = indices.map((valueIdx) => distinctValues[valueIdx] as D[K]);
                    const valuesSummed = sumValues(valuesToSum);

                    if (valuesSummed) {
                        extendDomain(valuesSummed, resultSumValues[resultIdx++]);
                    }
                }
            }
        }

        return {
            ...data,
            dataDomain: {
                ...data.dataDomain,
                sumValues: resultSumValues,
            },
        };
    }

    private initDataDomainProcessor() {
        const { keys: keyDefs, values: valueDefs } = this;
        const dataDomain: Map<K, { type: 'range'; domain: [number, number] } | { type: 'category'; domain: Set<any> }> =
            new Map();
        const initDataDomainKey = (key: K, type: DatumPropertyType, updateDataDomain: typeof dataDomain) => {
            if (type === 'category') {
                updateDataDomain.set(key, { type, domain: new Set() });
            } else {
                updateDataDomain.set(key, { type, domain: [Infinity, -Infinity] });
            }
        };
        const initDataDomain = (updateDataDomain = dataDomain) => {
            keyDefs.forEach((def) => initDataDomainKey(def.property, def.valueType, updateDataDomain));
            valueDefs.forEach((def) => initDataDomainKey(def.property, def.valueType, updateDataDomain));
            return updateDataDomain;
        };
        initDataDomain();

        const processValue = (key: K, value: any, updateDataDomain = dataDomain) => {
            // TODO: Handle illegal values or non-numeric/comparable types?
            if (!updateDataDomain.has(key)) {
                initDataDomain(updateDataDomain);
            }
            const meta = updateDataDomain.get(key);
            if (meta?.type === 'category') {
                meta.domain.add(value);
            } else if (meta?.type === 'range') {
                if (meta.domain[0] > value) {
                    meta.domain[0] = value;
                }
                if (meta.domain[1] < value) {
                    meta.domain[1] = value;
                }
            }
            return value;
        };

        return { dataDomain, processValue, initDataDomain };
    }
}
