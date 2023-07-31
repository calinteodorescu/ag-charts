import type { AgPolarChartOptions } from 'ag-charts-community';
import { AngleCategoryAxis } from '../../polar-axes/angle-category/angleCategoryAxis';
import { RadiusNumberAxis } from '../../polar-axes/radius-number/radiusNumberAxis';

export const NIGHTINGALE_DEFAULTS: AgPolarChartOptions = {
    axes: [
        {
            type: AngleCategoryAxis.type,
            shape: 'circle',
            groupPaddingInner: 0,
            groupPaddingOuter: 0,
        },
        {
            type: RadiusNumberAxis.type,
            shape: 'circle',
        },
    ],
};
