import type { _ModuleSupport } from 'ag-charts-community';
import { _Theme } from 'ag-charts-community';

import { WaterfallSeries } from './waterfallSeries';
import { WATERFALL_SERIES_THEME } from './waterfallThemes';

export const WaterfallModule: _ModuleSupport.SeriesModule<'waterfall'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'waterfall',
    solo: true,
    moduleFactory: (ctx) => new WaterfallSeries(ctx),
    tooltipDefaults: { range: 'exact' },
    defaultAxes: _Theme.swapAxisCondition(
        [
            { type: _Theme.CARTESIAN_AXIS_TYPE.NUMBER, position: _Theme.CARTESIAN_POSITION.LEFT },
            { type: _Theme.CARTESIAN_AXIS_TYPE.CATEGORY, position: _Theme.CARTESIAN_POSITION.BOTTOM },
        ],
        (series) => series?.direction === 'horizontal'
    ),
    themeTemplate: WATERFALL_SERIES_THEME,
    paletteFactory: ({ takeColors, colorsCount, userPalette, palette }) => {
        if (userPalette === 'user-indexed') {
            const { fills, strokes } = takeColors(colorsCount);
            return {
                line: { stroke: palette.neutral.stroke },
                item: {
                    positive: {
                        fill: fills[0],
                        stroke: strokes[0],
                    },
                    negative: {
                        fill: fills[1],
                        stroke: strokes[1],
                    },
                    total: {
                        fill: fills[2],
                        stroke: strokes[2],
                    },
                },
            };
        }
        return {
            line: { stroke: palette.neutral.stroke },
            item: {
                positive: {
                    fill: palette.altUp.fill,
                    stroke: palette.altUp.stroke,
                    label: {
                        color: _Theme.DEFAULT_LABEL_COLOUR,
                    },
                },
                negative: {
                    fill: palette.altDown.fill,
                    stroke: palette.altDown.stroke,
                    label: {
                        color: _Theme.DEFAULT_LABEL_COLOUR,
                    },
                },
                total: {
                    fill: palette.neutral.fill,
                    stroke: palette.neutral.stroke,
                    label: {
                        color: _Theme.DEFAULT_LABEL_COLOUR,
                    },
                },
            },
        };
    },
};
