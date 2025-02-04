/* eslint-disable sonarjs/no-duplicate-string */
import type { AgToolbarGroupPosition, AgToolbarOptions } from 'ag-charts-types';

import type { Module } from '../../module/module';
import { DEFAULT_TOOLBAR_POSITION } from '../themes/symbols';
import { Toolbar } from './toolbar';

const DAY = 1000 * 60 * 60 * 24;
const MONTH = DAY * 30;
const YEAR = DAY * 365;

const seriesType: AgToolbarOptions['seriesType'] = {
    enabled: false,
    position: 'left',
    align: 'start',
    buttons: [
        {
            tooltip: 'toolbarSeriesTypeDropdown',
            value: 'type',
            // @ts-expect-error
            haspopup: true,
        },
    ],
};

const annotations: AgToolbarOptions['annotations'] = {
    enabled: true,
    position: 'left',
    align: 'start',
    buttons: [
        {
            icon: 'trend-line-drawing',
            tooltip: 'toolbarAnnotationsLineAnnotations',
            value: 'line-menu',
            section: 'line-annotations',
            // @ts-expect-error
            haspopup: true,
        },
        {
            icon: 'text-annotation',
            tooltip: 'toolbarAnnotationsTextAnnotations',
            value: 'text-menu',
            section: 'text-annotations',
            // @ts-expect-error
            haspopup: true,
        },
        {
            icon: 'arrow-drawing',
            tooltip: 'toolbarAnnotationsShapeAnnotations',
            value: 'shape-menu',
            section: 'shape-annotations',
            // @ts-expect-error
            haspopup: true,
        },
        {
            icon: 'measurer-drawing',
            tooltip: 'toolbarAnnotationsMeasurerAnnotations',
            value: 'measurer-menu',
            section: 'measure-annotations',
            // @ts-expect-error
            haspopup: true,
        },
        {
            icon: 'delete',
            tooltip: 'toolbarAnnotationsClearAll',
            value: 'clear',
            section: 'tools',
        },
    ],
};

const annotationOptions: AgToolbarOptions['annotationOptions'] = {
    enabled: true,
    position: 'floating',
    align: 'start',
    draggable: true,
    buttons: [
        {
            icon: 'text-annotation',
            tooltip: 'toolbarAnnotationsTextColor',
            value: 'text-color',
            // @ts-expect-error
            haspopup: true,
        },
        {
            icon: 'line-color',
            tooltip: 'toolbarAnnotationsLineColor',
            value: 'line-color',
            // @ts-expect-error
            haspopup: true,
        },
        {
            icon: 'fill-color',
            tooltip: 'toolbarAnnotationsFillColor',
            value: 'fill-color',
            // @ts-expect-error
            haspopup: true,
        },
        {
            tooltip: 'toolbarAnnotationsTextSize',
            value: 'text-size',
            // @ts-expect-error
            haspopup: true,
        },
        {
            tooltip: 'toolbarAnnotationsLineStrokeWidth',
            value: 'line-stroke-width',
            // @ts-expect-error
            haspopup: true,
        },
        {
            icon: 'line-style-solid',
            tooltip: 'toolbarAnnotationsLineStyle',
            value: 'line-style-type',
            // @ts-expect-error
            haspopup: true,
        },
        {
            icon: 'settings',
            tooltip: 'toolbarAnnotationsSettings',
            value: 'settings',
            // @ts-expect-error
            haspopup: true,
        },
        {
            role: 'switch',
            icon: 'unlocked',
            tooltip: 'toolbarAnnotationsLock',
            ariaLabel: 'toolbarAnnotationsLock',
            checkedOverrides: {
                icon: 'locked',
                tooltip: 'toolbarAnnotationsUnlock',
            },
            value: 'lock',
        },
        {
            icon: 'delete',
            tooltip: 'toolbarAnnotationsDelete',
            value: 'delete',
        },
    ],
};

const ranges: AgToolbarOptions['ranges'] = {
    enabled: false,
    position: DEFAULT_TOOLBAR_POSITION as AgToolbarGroupPosition,
    align: 'start',
    buttons: [
        {
            label: 'toolbarRange1Month',
            ariaLabel: 'toolbarRange1MonthAria',
            value: MONTH,
        },
        {
            label: 'toolbarRange3Months',
            ariaLabel: 'toolbarRange3MonthsAria',
            value: 3 * MONTH,
        },
        {
            label: 'toolbarRange6Months',
            ariaLabel: 'toolbarRange6MonthsAria',
            value: 6 * MONTH,
        },
        {
            label: 'toolbarRangeYearToDate',
            ariaLabel: 'toolbarRangeYearToDateAria',
            value: (_start, end) => [new Date(`${new Date(end).getFullYear()}-01-01`).getTime(), end],
            id: 'year-to-date',
        },
        {
            label: 'toolbarRange1Year',
            ariaLabel: 'toolbarRange1YearAria',
            value: YEAR,
        },
        {
            label: 'toolbarRangeAll',
            ariaLabel: 'toolbarRangeAllAria',
            value: (start, end) => [start, end],
            id: 'all',
        },
    ],
};

const zoom: AgToolbarOptions['zoom'] = {
    enabled: true,
    position: 'top',
    align: 'end',
    buttons: [
        {
            icon: 'zoom-out',
            tooltip: 'toolbarZoomZoomOut',
            value: 'zoom-out',
        },
        {
            icon: 'zoom-in',
            tooltip: 'toolbarZoomZoomIn',
            value: 'zoom-in',
        },
        {
            icon: 'pan-left',
            tooltip: 'toolbarZoomPanLeft',
            value: 'pan-left',
        },
        {
            icon: 'pan-right',
            tooltip: 'toolbarZoomPanRight',
            value: 'pan-right',
        },
        {
            icon: 'pan-start',
            tooltip: 'toolbarZoomPanStart',
            value: 'pan-start',
        },
        {
            icon: 'pan-end',
            tooltip: 'toolbarZoomPanEnd',
            value: 'pan-end',
        },
        {
            icon: 'reset',
            tooltip: 'toolbarZoomReset',
            value: 'reset',
        },
    ],
};

export const ToolbarModule: Module = {
    type: 'root',
    optionsKey: 'toolbar',
    packageType: 'community',
    chartTypes: ['cartesian'],
    moduleFactory: (ctx) => new Toolbar(ctx),
    themeTemplate: {
        toolbar: {
            enabled: true,
            seriesType,
            annotations,
            annotationOptions,
            ranges,
            zoom,
        },
    },
};
