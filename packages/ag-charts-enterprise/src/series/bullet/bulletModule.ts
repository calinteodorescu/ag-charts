import { _ModuleSupport, _Theme } from 'ag-charts-community';

import { BulletSeries } from './bulletSeries';
import { BULLET_SERIES_THEME } from './bulletThemes';

export const BulletModule: _ModuleSupport.SeriesModule<'bullet'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    identifier: 'bullet',
    solo: true,
    instanceConstructor: BulletSeries,
    tooltipDefaults: { range: 'exact' },
    defaultAxes: [
        {
            type: _Theme.CARTESIAN_AXIS_TYPE.NUMBER,
            position: _Theme.POSITION.LEFT,
        },
        {
            type: _Theme.CARTESIAN_AXIS_TYPE.CATEGORY,
            position: _Theme.POSITION.BOTTOM,
        },
    ],
    themeTemplate: BULLET_SERIES_THEME,
    swapDefaultAxesCondition: (series) => series?.direction === 'horizontal',
    paletteFactory: ({ takeColors, colorsCount, themeTemplateParameters }) => {
        const {
            fills: [fill],
            strokes: [stroke],
        } = takeColors(colorsCount);
        const themeBackgroundColor = themeTemplateParameters.get(_Theme.DEFAULT_BACKGROUND_COLOUR);
        const backgroundFill =
            (Array.isArray(themeBackgroundColor) ? themeBackgroundColor[0] : themeBackgroundColor) ?? 'white';

        const targetStroke = themeTemplateParameters.get(_Theme.DEFAULT_CROSS_LINES_COLOUR);
        return {
            fill,
            stroke,
            target: { stroke: targetStroke },
            backgroundFill,
        };
    },
};
