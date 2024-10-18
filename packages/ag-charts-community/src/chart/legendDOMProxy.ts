import type { ModuleContext } from '../module/moduleContext';
import { DestroyFns } from '../util/destroy';
import { createElement } from '../util/dom';

export class LegendDOMProxy {
    public dirty = true;

    public readonly itemList: HTMLDivElement;
    public readonly itemDescription: HTMLParagraphElement;
    public readonly paginationGroup: HTMLDivElement;
    public readonly destroyFns: DestroyFns = new DestroyFns();
    public prevButton?: HTMLButtonElement;
    public nextButton?: HTMLButtonElement;

    public constructor(ctx: ModuleContext, idPrefix: string) {
        this.itemList = ctx.proxyInteractionService.createProxyContainer({
            type: 'list',
            id: `${idPrefix}-toolbar`,
            classList: ['ag-charts-proxy-legend-toolbar'],
            ariaLabel: { id: 'ariaLabelLegend' },
            ariaHidden: true,
        });
        this.paginationGroup = ctx.proxyInteractionService.createProxyContainer({
            type: 'group',
            id: `${idPrefix}-pagination`,
            classList: ['ag-charts-proxy-legend-pagination'],
            ariaLabel: { id: 'ariaLabelLegendPagination' },
            ariaOrientation: 'horizontal',
            ariaHidden: true,
        });
        this.itemDescription = createElement('p');
        this.itemDescription.style.display = 'none';
        this.itemDescription.id = `${idPrefix}-ariaDescription`;
        this.itemList.append(this.itemDescription);
    }

    public destroy() {
        this.destroyFns.destroy();
    }
}
