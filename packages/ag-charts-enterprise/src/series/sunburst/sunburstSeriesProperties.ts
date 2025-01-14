import type {
    AgSunburstSeriesItemStylerParams,
    AgSunburstSeriesLabelFormatterParams,
    AgSunburstSeriesOptions,
    AgSunburstSeriesStyle,
    AgSunburstSeriesTooltipRendererParams,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

import { AutoSizedLabel, AutoSizedSecondaryLabel } from '../util/autoSizedLabel';

const {
    HierarchySeriesProperties,
    HighlightStyle,
    SeriesTooltip,
    Validate,
    COLOR_STRING,
    FUNCTION,
    NUMBER,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
} = _ModuleSupport;

class SunburstSeriesTileHighlightStyle extends HighlightStyle {
    @Validate(STRING, { optional: true })
    fill?: string;

    @Validate(RATIO, { optional: true })
    fillOpacity?: number;

    @Validate(COLOR_STRING, { optional: true })
    stroke?: string;

    @Validate(POSITIVE_NUMBER, { optional: true })
    strokeWidth?: number;

    @Validate(RATIO, { optional: true })
    strokeOpacity?: number;

    @Validate(OBJECT)
    readonly label = new AutoSizedLabel<AgSunburstSeriesLabelFormatterParams>();

    @Validate(OBJECT)
    readonly secondaryLabel = new AutoSizedLabel<AgSunburstSeriesLabelFormatterParams>();
}

export class SunburstSeriesProperties extends HierarchySeriesProperties<AgSunburstSeriesOptions> {
    @Validate(STRING, { optional: true })
    sizeName?: string;

    @Validate(STRING, { optional: true })
    labelKey?: string;

    @Validate(STRING, { optional: true })
    secondaryLabelKey?: string;

    @Validate(RATIO)
    fillOpacity: number = 1;

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 0;

    @Validate(RATIO)
    strokeOpacity: number = 1;

    @Validate(POSITIVE_NUMBER)
    cornerRadius: number = 0;

    @Validate(NUMBER, { optional: true })
    sectorSpacing?: number;

    @Validate(NUMBER, { optional: true })
    padding?: number;

    @Validate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgSunburstSeriesItemStylerParams<unknown>, AgSunburstSeriesStyle>;

    @Validate(OBJECT)
    override highlightStyle = new SunburstSeriesTileHighlightStyle();

    @Validate(OBJECT)
    readonly label = new AutoSizedLabel<AgSunburstSeriesLabelFormatterParams>();

    @Validate(OBJECT)
    readonly secondaryLabel = new AutoSizedSecondaryLabel<AgSunburstSeriesLabelFormatterParams>();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgSunburstSeriesTooltipRendererParams<any>>();
}
