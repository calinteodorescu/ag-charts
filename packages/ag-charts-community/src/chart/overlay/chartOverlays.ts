import type { LocaleManager } from '../../locale/localeManager';
import { BaseProperties } from '../../util/properties';
import { BOOLEAN, OBJECT, Validate } from '../../util/validation';
import { Overlay } from './overlay';

export class ChartOverlays extends BaseProperties {
    @Validate(BOOLEAN)
    darkTheme = false;

    @Validate(OBJECT)
    readonly loading = new Overlay('ag-chart-loading-overlay', 'overlayLoadingData');

    @Validate(OBJECT)
    readonly noData = new Overlay('ag-chart-no-data-overlay', 'overlayNoData');

    @Validate(OBJECT)
    readonly noVisibleSeries = new Overlay('ag-chart-no-visible-series', 'overlayNoVisibleSeries');

    getFocusInfo(
        localeManager: LocaleManager
    ): { text: string; rect: { x: number; y: number; width: number; height: number } } | undefined {
        for (const overlay of [this.loading, this.noData, this.noVisibleSeries]) {
            if (overlay.focusBox !== undefined) {
                return { text: overlay.getText(localeManager), rect: overlay.focusBox };
            }
        }
        return undefined;
    }

    public destroy() {
        this.loading.removeElement();
        this.noData.removeElement();
        this.noVisibleSeries.removeElement();
    }
}
