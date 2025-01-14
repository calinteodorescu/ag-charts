import type { SeriesModule } from '../../../module/coreModules';
import { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION } from '../../themes/constants';
import { DEFAULT_FONT_FAMILY, DEFAULT_INSIDE_SERIES_LABEL_COLOUR, DEFAULT_SHADOW_COLOUR } from '../../themes/symbols';
import { HistogramSeries } from './histogramSeries';

export const HistogramSeriesModule: SeriesModule<'histogram'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['cartesian'],

    identifier: 'histogram',
    moduleFactory: (ctx) => new HistogramSeries(ctx),
    tooltipDefaults: { range: 'exact' },
    defaultAxes: [
        {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: CARTESIAN_POSITION.BOTTOM,
        },
        {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: CARTESIAN_POSITION.LEFT,
        },
    ],
    themeTemplate: {
        series: {
            strokeWidth: 1,
            fillOpacity: 1,
            strokeOpacity: 1,
            lineDash: [0],
            lineDashOffset: 0,
            label: {
                enabled: false,
                fontSize: 12,
                fontFamily: DEFAULT_FONT_FAMILY,
                color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
            },
            shadow: {
                enabled: false,
                color: DEFAULT_SHADOW_COLOUR,
                xOffset: 3,
                yOffset: 3,
                blur: 5,
            },
        },
    },
    paletteFactory: ({ takeColors }) => {
        const {
            fills: [fill],
            strokes: [stroke],
        } = takeColors(1);
        return { fill, stroke };
    },
};
