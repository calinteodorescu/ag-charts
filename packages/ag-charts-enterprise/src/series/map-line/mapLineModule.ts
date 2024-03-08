import { _ModuleSupport, _Theme } from 'ag-charts-community';

import { MapLineSeries } from './mapLineSeries';

const { EXTENDS_SERIES_DEFAULTS, DEFAULT_FONT_FAMILY, DEFAULT_LABEL_COLOUR, singleSeriesPaletteFactory } = _Theme;

export const MapLineModule: _ModuleSupport.SeriesModule<'map-line'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['topology'],

    identifier: 'map-line',
    instanceConstructor: MapLineSeries,
    seriesDefaults: {},
    themeTemplate: {
        series: {
            __extends__: EXTENDS_SERIES_DEFAULTS,
            strokeWidth: 1,
            lineDash: [0],
            lineDashOffset: 0,
            background: {
                strokeWidth: 0,
                fillOpacity: 0.2,
            },
            label: {
                enabled: true,
                fontStyle: undefined,
                fontWeight: undefined,
                fontSize: 12,
                fontFamily: DEFAULT_FONT_FAMILY,
                color: DEFAULT_LABEL_COLOUR,
            },
            tooltip: {
                position: {
                    type: 'node',
                },
            },
        },
        legend: {
            enabled: false,
        },
        gradientLegend: {
            enabled: false,
        },
    },
    paletteFactory: (opts) => {
        const { fill, stroke } = singleSeriesPaletteFactory(opts);
        return {
            stroke: fill,
            background: { fill, stroke },
        };
    },
};
