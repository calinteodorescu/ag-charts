import { type AgChartSyncOptions, _ModuleSupport } from 'ag-charts-community';

const { BOOLEAN, STRING, UNION, BaseProperties, ChartUpdateType, ObserveChanges, Validate } = _ModuleSupport;

export class ChartSync extends BaseProperties implements _ModuleSupport.ModuleInstance, AgChartSyncOptions {
    static className = 'Sync';

    @Validate(BOOLEAN)
    enabled: boolean = false;

    @Validate(STRING, { optional: true })
    @ObserveChanges<ChartSync>((target, newValue, oldValue) => {
        const { syncManager } = target.moduleContext;
        syncManager.unsubscribe(oldValue);
        syncManager.subscribe(newValue);
        target.syncSiblings(oldValue);
        target.syncSiblings(newValue);
    })
    groupId?: string;

    @Validate(UNION(['x', 'y', 'xy'], 'an axis'))
    axes: 'x' | 'y' | 'xy' = 'x';

    @Validate(BOOLEAN)
    @ObserveChanges<ChartSync>((target, newValue) => {
        if (newValue) {
            target.enabledZoomSync();
        } else {
            target.disableZoomSync?.();
        }
    })
    zoom: boolean = true;

    constructor(protected moduleContext: _ModuleSupport.ModuleContext) {
        super();
    }

    private enabledZoomSync() {
        const { syncManager, zoomManager } = this.moduleContext;
        this.disableZoomSync = zoomManager.addListener('zoom-change', (e) => {
            if ('stopPropagation' in e && e.stopPropagation) return;
            for (const chart of syncManager.getSiblings(this.groupId)) {
                chart.zoomManager.updateZoom('zoom', zoomManager.getZoom());
                (chart.zoomManager as any).listeners.dispatch('zoom-change', { ...e, stopPropagation: true });
            }
        });
    }

    private disableZoomSync?: () => void;

    syncSiblings(groupId?: string) {
        this.moduleContext.syncManager.getSiblings(groupId).forEach((chart) => {
            (chart as any).updateService.update(ChartUpdateType.UPDATE_DATA, { skipSync: true });
        });
    }

    syncAxes(stopPropagation = false) {
        const { syncManager } = this.moduleContext;
        const chart = syncManager.getChart();
        const syncSeries = syncManager.getGroup(this.groupId).flatMap((chart) => chart.series);

        for (const axis of chart.axes) {
            axis.boundSeries = syncSeries.filter((series) => {
                const seriesKeys = series.getKeys(axis.direction);
                return axis.keys.length ? axis.keys.some((key) => seriesKeys?.includes(key)) : true;
            });
        }

        if (!stopPropagation) {
            this.syncSiblings(this.groupId);
        }
    }

    // syncMouseInteractions() {
    //     // TODO: translate x, y according to each chart dimensions
    //     const { interactionManager, syncManager } = this.moduleContext;
    //     interactionManager.addListener('hover', (e) => {
    //         if ('stopPropagation' in e && e.stopPropagation) return;
    //         for (const chart of syncManager.getSiblings(this.groupId)) {
    //             (chart as any).interactionManager.listeners.dispatch('hover', { ...e, stopPropagation: true });
    //         }
    //     });
    //     interactionManager.addListener('leave', (e) => {
    //         if ('stopPropagation' in e && e.stopPropagation) return;
    //         for (const chart of syncManager.getSiblings(this.groupId)) {
    //             (chart as any).interactionManager.listeners.dispatch('leave', { ...e, stopPropagation: true });
    //         }
    //     });
    // }

    destroy() {
        this.disableZoomSync?.();
    }
}
