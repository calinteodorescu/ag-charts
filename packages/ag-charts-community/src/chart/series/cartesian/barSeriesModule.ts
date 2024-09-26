import type { SeriesModule } from '../../../module/coreModules';
import { singleSeriesPaletteFactory } from '../../../module/theme';
import { CARTESIAN_AXIS_TYPE, FONT_WEIGHT, POSITION } from '../../themes/constants';
import { DEFAULT_FONT_FAMILY, DEFAULT_INSIDE_SERIES_LABEL_COLOUR, DEFAULT_SHADOW_COLOUR } from '../../themes/symbols';
import { BarSeries } from './barSeries';

export const BarSeriesModule: SeriesModule<'bar'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['cartesian'],

    identifier: 'bar',
    moduleFactory: (ctx) => new BarSeries(ctx),
    stackable: true,
    groupable: true,
    tooltipDefaults: { range: 'exact' },
    defaultAxes: (series) =>
        series?.direction === 'horizontal'
            ? [
                  { type: CARTESIAN_AXIS_TYPE.NUMBER, position: POSITION.BOTTOM },
                  { type: CARTESIAN_AXIS_TYPE.CATEGORY, position: POSITION.LEFT },
              ]
            : [
                  { type: CARTESIAN_AXIS_TYPE.NUMBER, position: POSITION.LEFT },
                  { type: CARTESIAN_AXIS_TYPE.CATEGORY, position: POSITION.BOTTOM },
              ],
    themeTemplate: {
        series: {
            direction: 'vertical',
            fillOpacity: 1,
            strokeWidth: 0,
            lineDash: [0],
            lineDashOffset: 0,
            label: {
                enabled: false,
                fontWeight: FONT_WEIGHT.NORMAL,
                fontSize: 12,
                fontFamily: DEFAULT_FONT_FAMILY,
                color: DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
                placement: 'inside',
            },
            shadow: {
                enabled: false,
                color: DEFAULT_SHADOW_COLOUR,
                xOffset: 3,
                yOffset: 3,
                blur: 5,
            },
            errorBar: {
                cap: {
                    lengthRatio: 0.3,
                },
            },
        },
    },
    paletteFactory: singleSeriesPaletteFactory,
};
