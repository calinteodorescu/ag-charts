import { ContinuousScale } from '../../scale/continuousScale';
import { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import type { BBox } from '../../scene/bbox';
import { Logger } from '../../util/logger';
import { clamp } from '../../util/number';
import { ChartAxisDirection } from '../chartAxisDirection';
import type { DataController } from '../data/dataController';
import type { DataModel, DataModelOptions, ProcessedData, PropertyDefinition } from '../data/dataModel';
import type { PickFocusInputs, PickFocusOutputs, SeriesNodeDataContext } from './series';
import { Series } from './series';
import type { SeriesProperties } from './seriesProperties';
import type { SeriesNodeDatum } from './seriesTypes';

export abstract class DataModelSeries<
    TDatum extends SeriesNodeDatum,
    TProps extends SeriesProperties<any>,
    TLabel = TDatum,
    TContext extends SeriesNodeDataContext<TDatum, TLabel> = SeriesNodeDataContext<TDatum, TLabel>,
> extends Series<TDatum, TProps, TLabel, TContext> {
    protected dataModel?: DataModel<any, any, any>;
    protected processedData?: ProcessedData<any>;

    protected isContinuous(): { isContinuousX: boolean; isContinuousY: boolean } {
        const xScale = this.axes[ChartAxisDirection.X]?.scale;
        const yScale = this.axes[ChartAxisDirection.Y]?.scale;
        const isContinuousX = ContinuousScale.is(xScale) || OrdinalTimeScale.is(xScale);
        const isContinuousY = ContinuousScale.is(yScale) || OrdinalTimeScale.is(yScale);
        return { isContinuousX, isContinuousY };
    }

    private getModulePropertyDefinitions() {
        return this.moduleMap.mapModules((mod) => mod.getPropertyDefinitions(this.isContinuous())).flat();
    }

    // Request data, but with message dispatching to series-options (modules).
    protected async requestDataModel<
        D extends object,
        K extends keyof D & string = keyof D & string,
        G extends boolean | undefined = undefined,
    >(dataController: DataController, data: D[] | undefined, opts: DataModelOptions<K, boolean | undefined>) {
        // Merge properties of this series with properties of all the attached series-options
        opts.props.push(...(this.getModulePropertyDefinitions() as PropertyDefinition<K>[]));

        const { dataModel, processedData } = await dataController.request<D, K, G>(this.id, data ?? [], opts);

        this.dataModel = dataModel;
        this.processedData = processedData;
        this.dispatch('data-processed', { dataModel, processedData });
        return { dataModel, processedData };
    }

    protected isProcessedDataAnimatable() {
        const validationResults = this.processedData?.reduced?.animationValidation;
        if (!validationResults) {
            return true;
        }

        const { orderedKeys, uniqueKeys } = validationResults;
        return orderedKeys && uniqueKeys;
    }

    protected checkProcessedDataAnimatable() {
        if (!this.isProcessedDataAnimatable()) {
            this.ctx.animationManager.skipCurrentBatch();
        }
    }

    protected abstract computeFocusBounds(opts: PickFocusInputs): BBox | undefined;

    public abstract getNodeData(): TDatum[] | undefined;

    public override pickFocus(opts: PickFocusInputs): PickFocusOutputs<TDatum> | undefined {
        return this.doPickFocus(opts, this);
    }

    // The legend behaves differently for Pie and Donut series. We need to use a seriesItemEnabled
    // array to determine whether a datum has been toggled on/off using the legend.
    private doPickFocus<TSeries>(
        opts: PickFocusInputs,
        derivedSeries: TSeries & { readonly seriesItemEnabled?: readonly boolean[] }
    ): PickFocusOutputs<TDatum> | undefined {
        const nodeData = this.getNodeData();
        if (nodeData === undefined || nodeData.length === 0) {
            return undefined;
        }

        const { seriesRect } = opts;
        const datumIndex = this.computeFocusDatumIndex(opts, nodeData, derivedSeries.seriesItemEnabled);

        const datum = nodeData[datumIndex];
        const bbox = this.computeFocusBounds({ datumIndex, seriesRect });
        if (bbox !== undefined) {
            return { bbox, datum, datumIndex };
        }
    }

    private computeFocusDatumIndex(
        opts: PickFocusInputs,
        nodeData: TDatum[],
        seriesItemEnabled: readonly boolean[] | undefined
    ): number {
        if (seriesItemEnabled === undefined) {
            return clamp(0, opts.datumIndex, nodeData.length - 1);
        }

        if (nodeData.length !== seriesItemEnabled.length) {
            Logger.error(
                `invalid state: nodeData.length (${nodeData.length} !== seriesItemEnabled.length ($seriesItemEnabled.length})`
            );
        }

        let datumIndex: number = opts.datumIndex;
        // Find first visible datum by search forwards then backwards.
        while (datumIndex < seriesItemEnabled.length && !seriesItemEnabled[datumIndex]) {
            datumIndex++;
        }
        if (datumIndex === seriesItemEnabled.length) {
            datumIndex = opts.datumIndex - 1;
            while (datumIndex >= 0 && !seriesItemEnabled[datumIndex]) {
                datumIndex--;
            }
            if (datumIndex === -1) {
                Logger.error(`invalid state: no enabled datum found`);
            }
        }

        return datumIndex;
    }
}
