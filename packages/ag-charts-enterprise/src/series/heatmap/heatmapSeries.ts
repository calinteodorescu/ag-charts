import type {
    AgHeatmapSeriesFormat,
    AgHeatmapSeriesFormatterParams,
    AgHeatmapSeriesLabelFormatterParams,
    AgHeatmapSeriesTooltipRendererParams,
    FontStyle,
    FontWeight,
    TextAlign,
    VerticalAlign,
} from 'ag-charts-community';
import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';

import { AutoSizedLabel, formatLabels } from '../util/labelFormatter';

const {
    AND,
    Validate,
    SeriesNodePickMode,
    valueProperty,
    ChartAxisDirection,
    COLOR_STRING_ARRAY,
    NON_EMPTY_ARRAY,
    NUMBER,
    OPT_NUMBER,
    OPT_STRING,
    OPT_FUNCTION,
    OPT_COLOR_STRING,
    TEXT_ALIGN,
    VERTICAL_ALIGN,
} = _ModuleSupport;
const { Rect, PointerEvents } = _Scene;
const { ColorScale } = _Scale;
const { sanitizeHtml, Color, Logger } = _Util;

interface HeatmapNodeDatum extends Required<_ModuleSupport.CartesianSeriesNodeDatum> {
    readonly width: number;
    readonly height: number;
    readonly fill: string;
    readonly colorValue: any;
}

interface HeatmapLabelDatum extends _Scene.Point {
    series: _ModuleSupport.CartesianSeriesNodeDatum['series'];
    datum: any;
    itemId?: string;
    text: string;
    fontSize: number;
    lineHeight: number;
    fontStyle: FontStyle | undefined;
    fontFamily: string;
    fontWeight: FontWeight | undefined;
    color: string;
    textAlign: TextAlign;
    verticalAlign: VerticalAlign;
}

class HeatmapSeriesNodeClickEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends _ModuleSupport.CartesianSeriesNodeClickEvent<TEvent> {
    readonly colorKey?: string;

    constructor(type: TEvent, nativeEvent: MouseEvent, datum: HeatmapNodeDatum, series: HeatmapSeries) {
        super(type, nativeEvent, datum, series);
        this.colorKey = series.colorKey;
    }
}

const textAlignFactors: Record<TextAlign, number> = {
    left: -0.5,
    center: 0,
    right: -0.5,
};

const verticalAlignFactors: Record<VerticalAlign, number> = {
    top: -0.5,
    middle: 0,
    bottom: -0.5,
};

export class HeatmapSeries extends _ModuleSupport.CartesianSeries<_Scene.Rect, HeatmapNodeDatum, HeatmapLabelDatum> {
    static className = 'HeatmapSeries';
    static type = 'heatmap' as const;

    protected override readonly NodeClickEvent = HeatmapSeriesNodeClickEvent;

    readonly label = new AutoSizedLabel<AgHeatmapSeriesLabelFormatterParams>();

    @Validate(OPT_STRING)
    title?: string = undefined;

    @Validate(OPT_STRING)
    xKey?: string = undefined;

    @Validate(OPT_STRING)
    xName?: string = undefined;

    @Validate(OPT_STRING)
    yKey?: string = undefined;

    @Validate(OPT_STRING)
    yName?: string = undefined;

    @Validate(OPT_STRING)
    colorKey?: string = undefined;

    @Validate(OPT_STRING)
    colorName?: string = 'Color';

    @Validate(AND(COLOR_STRING_ARRAY, NON_EMPTY_ARRAY))
    colorRange: string[] = ['black', 'black'];

    @Validate(OPT_COLOR_STRING)
    stroke: string = 'black';

    @Validate(OPT_NUMBER(0))
    strokeWidth: number = 0;

    @Validate(TEXT_ALIGN)
    textAlign: TextAlign = 'center';

    @Validate(VERTICAL_ALIGN)
    verticalAlign: VerticalAlign = 'middle';

    @Validate(NUMBER(0))
    padding: number = 0;

    @Validate(OPT_FUNCTION)
    formatter?: (params: AgHeatmapSeriesFormatterParams<any>) => AgHeatmapSeriesFormat = undefined;

    readonly colorScale = new ColorScale();

    readonly tooltip = new _ModuleSupport.SeriesTooltip<AgHeatmapSeriesTooltipRendererParams>();

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
            pathsPerSeries: 0,
            hasMarkers: false,
            hasHighlightedLabels: true,
        });
    }

    override async processData(dataController: _ModuleSupport.DataController) {
        const { xKey = '', yKey = '', axes } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!xAxis || !yAxis) {
            return;
        }

        const data = xKey && yKey && this.data ? this.data : [];

        const { isContinuousX, isContinuousY } = this.isContinuous();

        const { colorScale, colorRange, colorKey } = this;

        const { dataModel, processedData } = await this.requestDataModel<any>(dataController, data ?? [], {
            props: [
                valueProperty(this, xKey, isContinuousX, { id: 'xValue' }),
                valueProperty(this, yKey, isContinuousY, { id: 'yValue' }),
                ...(colorKey ? [valueProperty(this, colorKey, true, { id: 'colorValue' })] : []),
            ],
        });

        if (this.isColorScaleValid()) {
            const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, 'colorValue').index;
            colorScale.domain = processedData.domain.values[colorKeyIdx];
            colorScale.range = colorRange;
            colorScale.update();
        }
    }

    private isColorScaleValid() {
        const { colorKey } = this;
        if (!colorKey) {
            return false;
        }

        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) {
            return false;
        }

        const colorDataIdx = dataModel.resolveProcessedDataIndexById(this, 'colorValue').index;
        const dataCount = processedData.data.length;
        const colorDataMissing = dataCount === 0 || dataCount === processedData.defs.values[colorDataIdx].missing;
        return !colorDataMissing;
    }

    override getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection): any[] {
        const { dataModel, processedData } = this;

        if (!dataModel || !processedData) return [];

        if (direction === ChartAxisDirection.X) {
            return dataModel.getDomain(this, `xValue`, 'value', processedData);
        } else {
            return dataModel.getDomain(this, `yValue`, 'value', processedData);
        }
    }

    async createNodeData() {
        const { data, visible, axes, dataModel } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!(data && dataModel && visible && xAxis && yAxis)) {
            return [];
        }

        if (xAxis.type !== 'category' || yAxis.type !== 'category') {
            Logger.warnOnce(
                `Heatmap series expected axes to have "category" type, but received "${xAxis.type}" and "${yAxis.type}" instead.`
            );
            return [];
        }

        const xDataIdx = dataModel.resolveProcessedDataIndexById(this, `xValue`).index;
        const yDataIdx = dataModel.resolveProcessedDataIndexById(this, `yValue`).index;
        const colorDataIdx = this.colorKey
            ? dataModel.resolveProcessedDataIndexById(this, `colorValue`).index
            : undefined;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const xOffset = (xScale.bandwidth ?? 0) / 2;
        const yOffset = (yScale.bandwidth ?? 0) / 2;
        const {
            colorScale,
            xKey = '',
            xName = '',
            yKey = '',
            yName = '',
            colorKey = '',
            colorName = '',
            textAlign,
            verticalAlign,
            padding,
        } = this;
        const colorScaleValid = this.isColorScaleValid();
        const nodeData: HeatmapNodeDatum[] = [];
        const labelData: HeatmapLabelDatum[] = [];

        const width = xScale.bandwidth ?? 10;
        const height = yScale.bandwidth ?? 10;

        const textAlignFactor = (width - 2 * padding) * textAlignFactors[textAlign];
        const verticalAlignFactor = (height - 2 * padding) * verticalAlignFactors[verticalAlign];

        const sizeFittingHeight = () => ({ width, height, meta: null });

        for (const { values, datum } of this.processedData?.data ?? []) {
            const xDatum = values[xDataIdx];
            const yDatum = values[yDataIdx];
            const x = xScale.convert(xDatum) + xOffset;
            const y = yScale.convert(yDatum) + yOffset;

            const colorValue = colorDataIdx != null ? values[colorDataIdx] : undefined;
            const fill = colorScaleValid && colorValue != null ? colorScale.convert(colorValue) : this.colorRange[0];

            const labelText =
                colorValue != null
                    ? this.getLabelText(this.label, {
                          value: colorValue,
                          datum,
                          colorKey,
                          colorName,
                          xKey,
                          yKey,
                          xName,
                          yName,
                      })
                    : undefined;

            const labels = formatLabels(
                labelText,
                this.label,
                undefined,
                this.label,
                { padding: this.padding },
                sizeFittingHeight
            );

            const point = { x, y, size: 0 };

            nodeData.push({
                series: this,
                itemId: yKey,
                yKey,
                xKey,
                xValue: xDatum,
                yValue: yDatum,
                colorValue,
                datum,
                point,
                width,
                height,
                fill,
                midPoint: { x, y },
            });

            if (labels?.label != null) {
                const { text, fontSize, lineHeight, height: labelHeight } = labels.label;
                const { fontStyle, fontFamily, fontWeight, color } = this.label;
                const x = point.x + textAlignFactor * (width - 2 * padding);
                const y = point.y + verticalAlignFactor * (height - 2 * padding) - (labels.height - labelHeight) * 0.5;

                labelData.push({
                    series: this,
                    itemId: yKey,
                    datum,
                    text,
                    fontSize,
                    lineHeight,
                    fontStyle,
                    fontFamily,
                    fontWeight,
                    color,
                    textAlign,
                    verticalAlign,
                    x,
                    y,
                });
            }
        }

        return [
            {
                itemId: this.yKey ?? this.id,
                nodeData,
                labelData,
                scales: super.calculateScaling(),
                visible: this.visible,
            },
        ];
    }

    protected override nodeFactory() {
        return new Rect();
    }

    protected override async updateDatumSelection(opts: {
        nodeData: HeatmapNodeDatum[];
        datumSelection: _Scene.Selection<_Scene.Rect, HeatmapNodeDatum>;
    }) {
        const { nodeData, datumSelection } = opts;
        const data = nodeData ?? [];
        return datumSelection.update(data);
    }

    protected override async updateDatumNodes(opts: {
        datumSelection: _Scene.Selection<_Scene.Rect, HeatmapNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight: isDatumHighlighted } = opts;

        const {
            xKey = '',
            yKey = '',
            colorKey,
            formatter,
            highlightStyle: {
                item: {
                    fill: highlightedFill,
                    stroke: highlightedStroke,
                    strokeWidth: highlightedDatumStrokeWidth,
                    fillOpacity: highlightedFillOpacity,
                },
            },
            id: seriesId,
            ctx: { callbackCache },
        } = this;

        const xAxis = this.axes[ChartAxisDirection.X];
        const [visibleMin, visibleMax] = xAxis?.visibleRange ?? [];
        const isZoomed = visibleMin !== 0 || visibleMax !== 1;
        const crisp = !isZoomed;

        datumSelection.each((rect, datum) => {
            const { point, width, height } = datum;

            const fill =
                isDatumHighlighted && highlightedFill !== undefined
                    ? Color.interpolate(datum.fill, highlightedFill)(highlightedFillOpacity ?? 1)
                    : datum.fill;
            const stroke = isDatumHighlighted && highlightedStroke !== undefined ? highlightedStroke : this.stroke;
            const strokeWidth =
                isDatumHighlighted && highlightedDatumStrokeWidth !== undefined
                    ? highlightedDatumStrokeWidth
                    : this.strokeWidth;

            let format: AgHeatmapSeriesFormat | undefined;
            if (formatter) {
                format = callbackCache.call(formatter, {
                    datum: datum.datum,
                    fill,
                    stroke,
                    strokeWidth,
                    highlighted: isDatumHighlighted,
                    xKey,
                    yKey,
                    colorKey,
                    seriesId,
                });
            }

            rect.crisp = crisp;
            rect.x = Math.floor(point.x - width / 2);
            rect.y = Math.floor(point.y - height / 2);
            rect.width = Math.ceil(width);
            rect.height = Math.ceil(height);
            rect.fill = format?.fill ?? fill;
            rect.stroke = format?.stroke ?? stroke;
            rect.strokeWidth = format?.strokeWidth ?? strokeWidth;
        });
    }

    protected async updateLabelSelection(opts: {
        labelData: HeatmapLabelDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, HeatmapLabelDatum>;
    }) {
        const { labelData, labelSelection } = opts;
        const { enabled } = this.label;
        const data = enabled ? labelData : [];

        return labelSelection.update(data);
    }

    protected async updateLabelNodes(opts: { labelSelection: _Scene.Selection<_Scene.Text, HeatmapLabelDatum> }) {
        opts.labelSelection.each((text, datum) => {
            text.text = datum.text;
            text.fontSize = datum.fontSize;
            text.lineHeight = datum.lineHeight;

            text.fontStyle = datum.fontStyle;
            text.fontFamily = datum.fontFamily;
            text.fontWeight = datum.fontWeight;
            text.fill = datum.color;

            text.textAlign = datum.textAlign;
            text.textBaseline = datum.verticalAlign;

            text.x = datum.x;
            text.y = datum.y;

            text.pointerEvents = PointerEvents.None;
        });
    }

    getTooltipHtml(nodeDatum: HeatmapNodeDatum): string {
        const { xKey, yKey, axes } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!xKey || !yKey || !xAxis || !yAxis) {
            return '';
        }

        const {
            formatter,
            tooltip,
            xName,
            yName,
            id: seriesId,
            stroke,
            strokeWidth,
            colorKey,
            colorName,
            colorScale,
            ctx: { callbackCache },
        } = this;

        const {
            datum,
            xValue,
            yValue,
            colorValue,
            // label: { text: labelText },
        } = nodeDatum;
        const fill = this.isColorScaleValid() ? colorScale.convert(colorValue) : this.colorRange[0];

        let format: AgHeatmapSeriesFormat | undefined;

        if (formatter) {
            format = callbackCache.call(formatter, {
                datum: nodeDatum,
                xKey,
                yKey,
                colorKey,
                fill,
                stroke,
                strokeWidth,
                highlighted: false,
                seriesId,
            });
        }

        const color = format?.fill ?? fill ?? 'gray';
        const title = this.title ?? yName;
        const xString = sanitizeHtml(xAxis.formatDatum(xValue));
        const yString = sanitizeHtml(yAxis.formatDatum(yValue));

        let content =
            `<b>${sanitizeHtml(xName || xKey)}</b>: ${xString}<br>` +
            `<b>${sanitizeHtml(yName || yKey)}</b>: ${yString}`;

        if (colorKey) {
            content = `<b>${sanitizeHtml(colorName || colorKey)}</b>: ${sanitizeHtml(colorValue)}<br>` + content;
        }

        return tooltip.toTooltipHtml(
            { title, content, backgroundColor: color },
            {
                seriesId,
                datum,
                xKey,
                yKey,
                xName,
                yName,
                title,
                color,
                colorKey,
            }
        );
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.GradientLegendDatum[] {
        const { data, dataModel, xKey, yKey } = this;

        if (!(data?.length && xKey && yKey && dataModel && legendType === 'gradient' && this.isColorScaleValid())) {
            return [];
        }

        return [
            {
                legendType: 'gradient',
                enabled: this.visible,
                seriesId: this.id,
                colorName: this.colorName,
                colorDomain:
                    this.processedData!.domain.values[
                        dataModel.resolveProcessedDataIndexById(this, 'colorValue').index
                    ],
                colorRange: this.colorRange,
            },
        ];
    }

    protected isLabelEnabled() {
        return this.label.enabled && Boolean(this.colorKey);
    }

    override getBandScalePadding() {
        return { inner: 0, outer: 0 };
    }
}
