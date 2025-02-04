import { type _ModuleSupport, _Theme } from 'ag-charts-community';

import defaultColorStops from '../gauge-util/defaultColorStops';
import { LinearGaugeSeries } from './linearGaugeSeries';

const {
    FONT_WEIGHT,
    DEFAULT_FONT_FAMILY,
    DEFAULT_HIERARCHY_FILLS,
    DEFAULT_LABEL_COLOUR,
    DEFAULT_INVERTED_LABEL_COLOUR,
    CARTESIAN_AXIS_TYPE,
} = _Theme;

export const LinearGaugeModule: _ModuleSupport.SeriesModule<'linear-gauge'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['gauge'],

    identifier: 'linear-gauge',
    moduleFactory: (ctx) => new LinearGaugeSeries(ctx),
    tooltipDefaults: { range: 'exact' },
    defaultAxes: [
        { type: CARTESIAN_AXIS_TYPE.NUMBER, line: { enabled: false } },
        { type: CARTESIAN_AXIS_TYPE.NUMBER, line: { enabled: false } },
    ],
    themeTemplate: {
        minWidth: 200,
        minHeight: 200,
        series: {
            thickness: 50,
            bar: {
                strokeWidth: 0,
            },
            segmentation: {
                enabled: false,
                interval: {},
                spacing: 1,
            },
            // @ts-expect-error Private
            defaultTarget: {
                fill: DEFAULT_LABEL_COLOUR,
                stroke: DEFAULT_LABEL_COLOUR,
                size: 10,
                shape: 'triangle',
                placement: 'after',
                spacing: 5,
                label: {
                    enabled: true,
                    fontWeight: FONT_WEIGHT.NORMAL,
                    fontSize: 12,
                    fontFamily: DEFAULT_FONT_FAMILY,
                    color: DEFAULT_LABEL_COLOUR,
                    spacing: 5,
                },
            },
            label: {
                enabled: false,
                placement: 'inside-start',
                fontWeight: FONT_WEIGHT.NORMAL,
                fontSize: 24,
                minimumFontSize: 12,
                spacing: 18,
                fontFamily: DEFAULT_FONT_FAMILY,
                color: DEFAULT_INVERTED_LABEL_COLOUR,
            },
            margin: 4,
            tooltip: {
                enabled: false,
            },
        },
        axes: {
            [_Theme.CARTESIAN_AXIS_TYPE.NUMBER]: {
                line: {
                    enabled: false,
                },
                gridLine: {
                    enabled: false,
                },
            },
        },
    },
    paletteFactory(params) {
        const { takeColors, colorsCount, userPalette, themeTemplateParameters } = params;
        const { fills } = takeColors(colorsCount);
        const defaultColorRange = themeTemplateParameters.get(_Theme.DEFAULT_GAUGE_SERIES_COLOR_RANGE) as
            | string[]
            | undefined;
        const hierarchyFills = themeTemplateParameters.get(DEFAULT_HIERARCHY_FILLS);
        const colorRange = userPalette === 'inbuilt' ? defaultColorRange : [fills[0], fills[1]];
        return {
            scale: {
                defaultFill: hierarchyFills?.[1],
                stroke: hierarchyFills?.[2],
            },
            defaultColorRange: defaultColorStops(colorRange),
        };
    },
};
