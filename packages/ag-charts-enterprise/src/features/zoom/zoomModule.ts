import type { AgZoomOptions, _ModuleSupport } from 'ag-charts-community';

import { Zoom } from './zoom';

const buttons: AgZoomOptions['buttons'] = {
    enabled: true,
    buttons: [
        {
            icon: 'zoom-out',
            tooltip: 'toolbarZoomZoomOut',
            value: 'zoom-out',
            section: 'scale',
        },
        {
            icon: 'zoom-in',
            tooltip: 'toolbarZoomZoomIn',
            value: 'zoom-in',
            section: 'scale',
        },
        {
            icon: 'pan-left',
            tooltip: 'toolbarZoomPanLeft',
            value: 'pan-left',
            section: 'pan',
        },
        {
            icon: 'pan-right',
            tooltip: 'toolbarZoomPanRight',
            value: 'pan-right',
            section: 'pan',
        },
        {
            icon: 'reset',
            tooltip: 'toolbarZoomReset',
            value: 'reset',
            section: 'reset',
        },
    ],
};

export const ZoomModule: _ModuleSupport.Module = {
    type: 'root',
    optionsKey: 'zoom',
    packageType: 'enterprise',
    chartTypes: ['cartesian', 'topology'],
    dependencies: ['toolbar'],
    moduleFactory: (ctx) => new Zoom(ctx),
    themeTemplate: {
        zoom: {
            anchorPointX: 'end',
            anchorPointY: 'middle',
            axes: 'x',
            buttons,
            enabled: false,
            enableAxisDragging: true,
            enableDoubleClickToReset: true,
            enablePanning: true,
            enableScrolling: true,
            enableSelecting: false,
            deceleration: 'short',
            minVisibleItemsX: 2,
            minVisibleItemsY: 2,
            panKey: 'alt',
            scrollingStep: 0.1,
        },
    },
};
