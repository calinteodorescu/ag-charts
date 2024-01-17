import type { AgBarSeriesStyle } from 'ag-charts-community';
import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';

import { BulletSeriesProperties } from './bulletSeriesProperties';

const {
    animationValidation,
    collapsedStartingBarPosition,
    diff,
    keyProperty,
    partialAssign,
    prepareBarAnimationFunctions,
    resetBarSelectionsFn,
    seriesLabelFadeInAnimation,
    valueProperty,
} = _ModuleSupport;
const { fromToMotion } = _Scene.motion;
const { sanitizeHtml } = _Util;

interface BulletNodeDatum extends _ModuleSupport.CartesianSeriesNodeDatum {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly cumulativeValue: number;
    readonly target?: {
        readonly value: number;
        readonly x1: number;
        readonly y1: number;
        readonly x2: number;
        readonly y2: number;
    };
}

interface NormalizedColorRange {
    color: string;
    start: number;
    stop: number;
}

const STYLING_KEYS: (keyof _Scene.Shape)[] = [
    'fill',
    'fillOpacity',
    'stroke',
    'strokeWidth',
    'strokeOpacity',
    'lineDash',
    'lineDashOffset',
];

type BulletAnimationData = _ModuleSupport.CartesianAnimationData<_Scene.Rect, BulletNodeDatum>;

export class BulletSeries extends _ModuleSupport.AbstractBarSeries<_Scene.Rect, BulletNodeDatum> {
    override properties = new BulletSeriesProperties();

    private normalizedColorRanges: NormalizedColorRange[] = [];
    private colorRangesGroup: _Scene.Group;
    private colorRangesSelection: _Scene.Selection<_Scene.Rect, NormalizedColorRange>;
    private targetLinesSelection: _Scene.Selection<_Scene.Line, BulletNodeDatum>;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            pickModes: [_ModuleSupport.SeriesNodePickMode.EXACT_SHAPE_MATCH],
            hasHighlightedLabels: true,
            animationResetFns: {
                datum: resetBarSelectionsFn,
            },
        });
        this.colorRangesGroup = new _Scene.Group({ name: `${this.id}-colorRanges` });
        this.colorRangesSelection = _Scene.Selection.select(this.colorRangesGroup, _Scene.Rect, false);
        this.rootGroup.append(this.colorRangesGroup);
        this.targetLinesSelection = _Scene.Selection.select(this.annotationGroup, _Scene.Line, false);
    }

    override destroy() {
        this.rootGroup.removeChild(this.colorRangesGroup);
        super.destroy();
    }

    override async processData(dataController: _ModuleSupport.DataController) {
        if (!this.properties.isValid() || !this.data) {
            return;
        }

        const { valueKey, targetKey } = this.properties;
        const isContinuousX = _Scale.ContinuousScale.is(this.getCategoryAxis()?.scale);
        const isContinuousY = _Scale.ContinuousScale.is(this.getValueAxis()?.scale);
        const extraProps = [];

        if (targetKey !== undefined) {
            extraProps.push(valueProperty(this, targetKey, isContinuousY, { id: 'target' }));
        }

        if (!this.ctx.animationManager.isSkipped()) {
            if (this.processedData !== undefined) {
                extraProps.push(diff(this.processedData));
            }
            extraProps.push(animationValidation(this));
        }

        // Bullet graphs only need 1 datum, but we keep that `data` option as array for consistency with other series
        // types and future compatibility (we may decide to support multiple datum at some point).
        await this.requestDataModel<any, any, true>(dataController, this.data.slice(0, 1), {
            props: [
                keyProperty(this, valueKey, isContinuousX, { id: 'xValue' }),
                valueProperty(this, valueKey, isContinuousY, { id: 'value' }),
                ...extraProps,
            ],
            groupByKeys: true,
            dataVisible: this.visible,
        });

        this.animationState.transition('updateData');
    }

    override getBandScalePadding() {
        return { inner: 0, outer: 0 };
    }

    private getMaxValue(): number {
        return Math.max(...(this.getValueAxis()?.dataDomain.domain ?? [0]));
    }

    override getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection) {
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) {
            return [];
        }

        const { valueKey, targetKey, valueName } = this.properties;

        if (direction === this.getCategoryDirection()) {
            return [valueName ?? valueKey];
        } else if (direction == this.getValueAxis()?.direction) {
            const valueDomain = dataModel.getDomain(this, 'value', 'value', processedData);
            const targetDomain =
                targetKey === undefined ? [] : dataModel.getDomain(this, 'target', 'value', processedData);
            return [0, Math.max(...valueDomain, ...targetDomain)];
        } else {
            throw new Error(`unknown direction ${direction}`);
        }
    }

    override getKeys(direction: _ModuleSupport.ChartAxisDirection): string[] {
        if (direction === this.getBarDirection()) {
            return [this.properties.valueKey];
        }
        return super.getKeys(direction);
    }

    override async createNodeData() {
        const { dataModel, processedData } = this;
        const {
            valueKey,
            targetKey,
            widthRatio,
            target: { lengthRatio },
        } = this.properties;
        const xScale = this.getCategoryAxis()?.scale;
        const yScale = this.getValueAxis()?.scale;
        if (!valueKey || !dataModel || !processedData || !xScale || !yScale) return [];
        if (widthRatio === undefined || lengthRatio === undefined) return [];

        const multiplier = xScale.bandwidth ?? NaN;
        const maxValue = this.getMaxValue();
        const valueIndex = dataModel.resolveProcessedDataIndexById(this, 'value').index;
        const targetIndex =
            targetKey === undefined ? NaN : dataModel.resolveProcessedDataIndexById(this, 'target').index;
        const context: _ModuleSupport.CartesianSeriesNodeDataContext<BulletNodeDatum> = {
            itemId: valueKey,
            nodeData: [],
            labelData: [],
            scales: super.calculateScaling(),
            visible: this.visible,
        };
        for (const { datum, values } of processedData.data) {
            if (!Array.isArray(datum) || datum.length < 1) {
                continue;
            }

            if (values[0][valueIndex] < 0) {
                _Util.Logger.warnOnce('negative values are not supported, clipping to 0.');
            }

            const xValue = this.properties.valueName ?? this.properties.valueKey;
            const yValue = Math.min(maxValue, Math.max(0, values[0][valueIndex]));
            const y = yScale.convert(yValue);
            const barWidth = widthRatio * multiplier;
            const bottomY = yScale.convert(0);
            const barAlongX = this.getBarDirection() === _ModuleSupport.ChartAxisDirection.X;
            const rect = {
                x: (multiplier * (1.0 - widthRatio)) / 2,
                y: Math.min(y, bottomY),
                width: barWidth,
                height: Math.abs(bottomY - y),
            };
            if (barAlongX) {
                [rect.x, rect.y, rect.width, rect.height] = [rect.y, rect.x, rect.height, rect.width];
            }

            let target;
            if (values[0][targetIndex] < 0) {
                _Util.Logger.warnOnce('negative targets are not supported, ignoring.');
            }

            if (this.properties.targetKey && values[0][targetIndex] >= 0) {
                const targetLineLength = lengthRatio * multiplier;
                const targetValue = Math.min(maxValue, values[0][targetIndex]);
                if (!isNaN(targetValue) && targetValue !== undefined) {
                    const convertedY = yScale.convert(targetValue);
                    let x1 = (multiplier * (1.0 - lengthRatio)) / 2;
                    let x2 = x1 + targetLineLength;
                    let [y1, y2] = [convertedY, convertedY];
                    if (barAlongX) {
                        [x1, x2, y1, y2] = [y1, y2, x1, x2];
                    }
                    target = { value: targetValue, x1, x2, y1, y2 };
                }
            }

            const nodeData: BulletNodeDatum = {
                series: this,
                datum: datum[0],
                xKey: valueKey,
                xValue,
                yKey: valueKey,
                yValue,
                cumulativeValue: yValue,
                target,
                ...rect,
                midPoint: { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
            };
            context.nodeData.push(nodeData);
        }

        const sortedRanges = [...this.properties.colorRanges].sort(
            (a, b) => (a.stop || maxValue) - (b.stop || maxValue)
        );
        let start = 0;
        this.normalizedColorRanges = sortedRanges.map((item) => {
            const stop = Math.min(maxValue, item.stop ?? Infinity);
            const result = { color: item.color, start, stop };
            start = stop;
            return result;
        });

        return [context];
    }

    override getLegendData(_legendType: _ModuleSupport.ChartLegendType) {
        return [];
    }

    override getTooltipHtml(nodeDatum: BulletNodeDatum): string {
        const { valueKey, valueName, targetKey, targetName } = this.properties;
        const axis = this.getValueAxis();
        const { yValue: valueValue, target: { value: targetValue } = { value: undefined }, datum } = nodeDatum;

        if (valueKey === undefined || valueValue === undefined || axis === undefined) {
            return '';
        }

        const makeLine = (key: string, name: string | undefined, value: number) => {
            const nameString = sanitizeHtml(name ?? key);
            const valueString = sanitizeHtml(axis.formatDatum(value));
            return `<b>${nameString}</b>: ${valueString}`;
        };
        const title = undefined;
        const content =
            targetKey === undefined || targetValue === undefined
                ? makeLine(valueKey, valueName, valueValue)
                : `${makeLine(valueKey, valueName, valueValue)}<br/>${makeLine(targetKey, targetName, targetValue)}`;

        return this.properties.tooltip.toTooltipHtml(
            { title, content, backgroundColor: this.properties.fill },
            { datum, title, seriesId: this.id, valueKey, valueName, targetKey, targetName }
        );
    }

    protected override isLabelEnabled() {
        return false;
    }

    protected override nodeFactory() {
        return new _Scene.Rect();
    }

    protected override async updateDatumSelection(opts: {
        nodeData: BulletNodeDatum[];
        datumSelection: _Scene.Selection<_Scene.Rect, BulletNodeDatum>;
    }) {
        this.targetLinesSelection.update(opts.nodeData, undefined, undefined);
        return opts.datumSelection.update(opts.nodeData, undefined, undefined);
    }

    protected override async updateDatumNodes(opts: {
        datumSelection: _Scene.Selection<_Scene.Rect, BulletNodeDatum>;
        isHighlight: boolean;
    }) {
        // The translation of the rectangles (values) is updated by the animation manager.
        // The target lines aren't animated, therefore we must update the translation here.
        for (const { node } of opts.datumSelection) {
            const style: AgBarSeriesStyle = this.properties;
            partialAssign(STYLING_KEYS, node, style);
        }

        for (const { node, datum } of this.targetLinesSelection) {
            if (datum.target !== undefined) {
                const style: AgBarSeriesStyle = this.properties.target;
                partialAssign(['x1', 'x2', 'y1', 'y2'], node, datum.target);
                partialAssign(STYLING_KEYS, node, style);
            } else {
                node.visible = false;
            }
        }
    }

    private async updateColorRanges() {
        const valAxis = this.getValueAxis();
        const catAxis = this.getCategoryAxis();
        if (!valAxis || !catAxis) return;
        const [min, max] = [0, Math.max(...catAxis.scale.range)];
        const computeRect: (rect: _Scene.Rect, colorRange: NormalizedColorRange) => void =
            this.getBarDirection() === _ModuleSupport.ChartAxisDirection.Y
                ? (rect, colorRange) => {
                      rect.x = min;
                      rect.y = valAxis.scale.convert(colorRange.stop);
                      rect.height = valAxis.scale.convert(colorRange.start) - rect.y;
                      rect.width = max;
                  }
                : (rect, colorRange) => {
                      rect.x = valAxis.scale.convert(colorRange.start);
                      rect.y = min;
                      rect.height = max;
                      rect.width = valAxis.scale.convert(colorRange.stop) - rect.x;
                  };
        this.colorRangesSelection.update(this.normalizedColorRanges);
        for (const { node, datum } of this.colorRangesSelection) {
            computeRect(node, datum);
            node.fill = datum.color;
        }
    }

    protected override async updateNodes(
        highlightedItems: BulletNodeDatum[] | undefined,
        seriesHighlighted: boolean | undefined,
        anySeriesItemEnabled: boolean
    ) {
        super.updateNodes(highlightedItems, seriesHighlighted, anySeriesItemEnabled);
        await this.updateColorRanges();
    }

    protected override async updateLabelSelection(opts: {
        labelData: BulletNodeDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, BulletNodeDatum>;
    }) {
        return opts.labelSelection;
    }

    protected override async updateLabelNodes(_opts: {
        labelSelection: _Scene.Selection<_Scene.Text, BulletNodeDatum>;
    }) {}

    override animateEmptyUpdateReady(data: BulletAnimationData) {
        const { datumSelections, labelSelections, annotationSelections } = data;

        const fns = prepareBarAnimationFunctions(collapsedStartingBarPosition(this.isVertical(), this.axes));

        fromToMotion(this.id, 'nodes', this.ctx.animationManager, datumSelections, fns);
        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelections);
        seriesLabelFadeInAnimation(this, 'annotations', this.ctx.animationManager, annotationSelections);
    }

    override animateWaitingUpdateReady(data: BulletAnimationData) {
        const { datumSelections, labelSelections, annotationSelections } = data;

        this.ctx.animationManager.stopByAnimationGroupId(this.id);

        const diff = this.processedData?.reduced?.diff;
        const fns = prepareBarAnimationFunctions(collapsedStartingBarPosition(this.isVertical(), this.axes));

        fromToMotion(
            this.id,
            'nodes',
            this.ctx.animationManager,
            datumSelections,
            fns,
            (_, datum) => String(datum.xValue),
            diff
        );

        const hasMotion = diff?.changed ?? true;
        if (hasMotion) {
            seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelections);
            seriesLabelFadeInAnimation(this, 'annotations', this.ctx.animationManager, annotationSelections);
        }
    }
}
