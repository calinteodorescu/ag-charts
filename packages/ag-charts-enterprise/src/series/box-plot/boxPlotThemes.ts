import { _Theme } from 'ag-charts-community';

export const BOX_PLOT_SERIES_THEME = {
    series: {
        direction: 'vertical' as const,
        // @todo(AG-11876) Use fillOpacity to match area, range area, radar area, chord, and sankey series
        // fillOpacity: 0.3,
        strokeWidth: 2,
    },
    axes: {
        [_Theme.CARTESIAN_AXIS_TYPE.NUMBER]: {
            crosshair: {
                snap: false,
            },
        },
        [_Theme.CARTESIAN_AXIS_TYPE.CATEGORY]: {
            groupPaddingInner: 0.2,
            crosshair: {
                enabled: false,
                snap: false,
            },
        },
    },
};
