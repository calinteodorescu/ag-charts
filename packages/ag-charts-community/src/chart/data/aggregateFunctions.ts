import { isFiniteNumber } from '../../util/type-guards';
import { ContinuousDomain } from './dataDomain';
import type { AggregatePropertyDefinition, DatumPropertyDefinition } from './dataModel';

export function sumValues(values: any[], accumulator: [number, number] = [0, 0]) {
    for (const value of values) {
        if (typeof value !== 'number') {
            continue;
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

export function sum(id: string, matchGroupId: string) {
    const result: AggregatePropertyDefinition<any, any> = {
        id,
        matchGroupIds: [matchGroupId],
        type: 'aggregate',
        aggregateFunction: (values) => sumValues(values),
    };

    return result;
}

export function groupSum(id: string, matchGroupId?: string): AggregatePropertyDefinition<any, any> {
    return {
        id,
        type: 'aggregate',
        matchGroupIds: matchGroupId ? [matchGroupId] : undefined,
        aggregateFunction: (values) => sumValues(values),
        groupAggregateFunction: (next, acc = [0, 0]) => {
            acc[0] += next?.[0] ?? 0;
            acc[1] += next?.[1] ?? 0;
            return acc;
        },
    };
}

export function range(id: string, matchGroupId: string) {
    const result: AggregatePropertyDefinition<any, any> = {
        id,
        matchGroupIds: [matchGroupId],
        type: 'aggregate',
        aggregateFunction: (values) => ContinuousDomain.extendDomain(values),
    };

    return result;
}

export function groupCount(id: string): AggregatePropertyDefinition<any, any> {
    return {
        id,
        type: 'aggregate',
        aggregateFunction: () => [0, 1],
        groupAggregateFunction: (next, acc = [0, 0]) => {
            acc[0] += next?.[0] ?? 0;
            acc[1] += next?.[1] ?? 0;
            return acc;
        },
    };
}

export function groupAverage(id: string, matchGroupId?: string) {
    const def: AggregatePropertyDefinition<any, any, [number, number], [number, number, number]> = {
        id,
        matchGroupIds: matchGroupId ? [matchGroupId] : undefined,
        type: 'aggregate',
        aggregateFunction: (values) => sumValues(values),
        groupAggregateFunction: (next, acc = [0, 0, -1]) => {
            acc[0] += next?.[0] ?? 0;
            acc[1] += next?.[1] ?? 0;
            acc[2]++;
            return acc;
        },
        finalFunction: (acc = [0, 0, 0]) => {
            const result = acc[0] + acc[1];
            if (result >= 0) {
                return [0, result / acc[2]];
            }
            return [result / acc[2], 0];
        },
    };

    return def;
}

export function area(id: string, aggFn: AggregatePropertyDefinition<any, any>, matchGroupId?: string) {
    const result: AggregatePropertyDefinition<any, any> = {
        id,
        matchGroupIds: matchGroupId ? [matchGroupId] : undefined,
        type: 'aggregate',
        aggregateFunction: (values, keyRange = []) => {
            const keyWidth = keyRange[1] - keyRange[0];
            return aggFn.aggregateFunction(values).map((v) => v / keyWidth) as [number, number];
        },
    };

    if (aggFn.groupAggregateFunction) {
        result.groupAggregateFunction = aggFn.groupAggregateFunction;
    }

    return result;
}

export function accumulatedValue(onlyPositive?: boolean): DatumPropertyDefinition<any>['processor'] {
    return () => {
        let value = 0;

        return (datum: any) => {
            if (!isFiniteNumber(datum)) {
                return datum;
            }

            value += onlyPositive ? Math.max(0, datum) : datum;
            return value;
        };
    };
}

export function trailingAccumulatedValue(): DatumPropertyDefinition<any>['processor'] {
    return () => {
        let value = 0;

        return (datum: any) => {
            if (!isFiniteNumber(datum)) {
                return datum;
            }

            const trailingValue = value;
            value += datum;
            return trailingValue;
        };
    };
}
