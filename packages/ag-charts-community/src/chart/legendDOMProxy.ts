import type { LocaleManager } from '../locale/localeManager';
import type { ModuleContext } from '../module/moduleContext';
import type { Node } from '../scene/node';
import type { Selection } from '../scene/selection';
import { Transformable } from '../scene/transformable';
import { setElementStyle } from '../util/attributeUtil';
import type { BBoxValues } from '../util/bboxinterface';
import { DestroyFns } from '../util/destroy';
import { createElement, setElementBBox } from '../util/dom';
import { initRovingTabIndex } from '../util/keynavUtil';
import { isDefined } from '../util/type-guards';
import type { Page } from './gridLayout';
import type { CategoryLegendDatum } from './legendDatum';
import type { LegendMarkerLabel } from './legendMarkerLabel';
import type { Pagination } from './pagination/pagination';

type ItemSelection = Selection<LegendMarkerLabel, CategoryLegendDatum>;
type CategoryLegendDatumReader = { getItemLabel(datum: CategoryLegendDatum): string | undefined };

interface ButtonListener {
    onClick(event: Event, datum: CategoryLegendDatum, proxyButton: HTMLButtonElement): void;
    onDoubleClick(event: MouseEvent, datum: CategoryLegendDatum): void;
    onHover(event: FocusEvent | MouseEvent, node: LegendMarkerLabel): void;
    onLeave(): void;
    onContextClick(sourceEvent: MouseEvent, node: LegendMarkerLabel): void;
}

type LegendDOMProxyUpdateParams = {
    visible: boolean;
    interactive: boolean;
    ctx: Pick<ModuleContext, 'proxyInteractionService' | 'localeManager'>;
    itemSelection: ItemSelection;
    group: Node;
    pagination: Pagination;
    oldPages: Page[] | undefined;
    newPages: Page[];
    datumReader: CategoryLegendDatumReader;
    itemListener: ButtonListener;
};

type LegendDOMProxyPageChangeParams = Pick<
    LegendDOMProxyUpdateParams,
    'itemSelection' | 'group' | 'pagination' | 'interactive'
>;

export class LegendDOMProxy {
    private dirty = true;

    private readonly itemList: HTMLDivElement;
    private readonly itemDescription: HTMLParagraphElement;
    private readonly paginationGroup: HTMLDivElement;
    private readonly destroyFns: DestroyFns = new DestroyFns();
    private prevButton?: HTMLButtonElement;
    private nextButton?: HTMLButtonElement;

    public constructor(
        ctx: Pick<ModuleContext, 'proxyInteractionService' | 'localeManager'>,
        private readonly idPrefix: string
    ) {
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
        this.itemDescription.textContent = this.getItemAriaDescription(ctx.localeManager);
        this.itemList.append(this.itemDescription);
    }

    public destroy() {
        this.destroyFns.destroy();
    }

    private initLegendList(params: LegendDOMProxyUpdateParams) {
        if (!this.dirty) return;

        const { ctx, itemSelection, datumReader, itemListener } = params;
        const lm = ctx.localeManager;
        const count = itemSelection.length;
        itemSelection.each((markerLabel, datum, index) => {
            // Create the hidden CSS button.
            markerLabel.destroyProxyButton();
            markerLabel.proxyButton ??= ctx.proxyInteractionService.createProxyElement({
                type: 'listswitch',
                id: `ag-charts-legend-item-${index}`,
                textContent: this.getItemAriaText(lm, datumReader.getItemLabel(datum), index, count),
                ariaChecked: !!markerLabel.datum.enabled,
                ariaDescribedBy: this.itemDescription.id,
                parent: this.itemList,
                // Retrieve the datum from the node rather than from the method parameter.
                // The method parameter `datum` gets destroyed when the data is refreshed
                // using Series.getLegendData(). But the scene node will stay the same.
                onclick: (ev) => itemListener.onClick(ev, markerLabel.datum, markerLabel.proxyButton!.button),
                ondblclick: (ev) => itemListener.onDoubleClick(ev, markerLabel.datum),
                onmouseenter: (ev) => itemListener.onHover(ev, markerLabel),
                onmouseleave: () => itemListener.onLeave(),
                oncontextmenu: (ev) => itemListener.onContextClick(ev, markerLabel),
                onblur: () => itemListener.onLeave(),
                onfocus: (ev) => itemListener.onHover(ev, markerLabel),
            });
        });

        const buttons: HTMLButtonElement[] = itemSelection
            .nodes()
            .map((markerLabel) => markerLabel.proxyButton?.button)
            .filter(isDefined);
        this.destroyFns.setFns([
            ...initRovingTabIndex({ orientation: 'horizontal', buttons }),
            ...initRovingTabIndex({ orientation: 'vertical', buttons }),
        ]);
        this.itemList.ariaHidden = (buttons.length === 0).toString();
        this.dirty = false;
    }

    public update(params: LegendDOMProxyUpdateParams) {
        this.updateVisibility(params.visible);
        if (params.visible) {
            this.initLegendList(params);
            this.updateItemProxyButtons(params);
            this.updatePaginationProxyButtons(params);
        }
    }

    private updateVisibility(visible: boolean) {
        setElementStyle(this.itemList, 'display', visible ? undefined : 'none');
    }

    private updateItemProxyButtons({ itemSelection, group, pagination, interactive }: LegendDOMProxyPageChangeParams) {
        const groupBBox = Transformable.toCanvas(group);
        setElementBBox(this.itemList, groupBBox);

        const pointer = interactive ? 'pointer' : undefined;
        const maxHeight = Math.max(...itemSelection.nodes().map((l) => l.getBBox().height));
        itemSelection.each((l) => {
            if (l.proxyButton) {
                const { listitem, button } = l.proxyButton;
                const visible = l.pageIndex === pagination.currentPage;

                const { x, y, height, width } = Transformable.toCanvas(l);
                const margin = (maxHeight - height) / 2; // CRT-543 Give the legend items the same heights for a better look.
                const bbox: BBoxValues = { x: x - groupBBox.x, y: y - margin - groupBBox.y, height: maxHeight, width };

                // TODO(olegat) this should be part of CSS once all element types support pointer events.
                setElementStyle(button, 'pointer-events', visible ? 'auto' : 'none');
                setElementStyle(button, 'cursor', pointer);
                setElementBBox(listitem, bbox);
            }
        });
    }

    private updatePaginationProxyButtons(params: LegendDOMProxyUpdateParams) {
        const { ctx, pagination, oldPages, newPages } = params;
        this.paginationGroup.style.display = pagination.visible ? 'absolute' : 'none';

        const oldNeedsButtons = (oldPages?.length ?? newPages.length) > 1;
        const newNeedsButtons = newPages.length > 1;

        if (oldNeedsButtons !== newNeedsButtons) {
            if (newNeedsButtons) {
                this.prevButton = ctx.proxyInteractionService.createProxyElement({
                    type: 'button',
                    id: `${this.idPrefix}-prev-page`,
                    textContent: { id: 'ariaLabelLegendPagePrevious' },
                    tabIndex: 0,
                    parent: this.paginationGroup,
                    onclick: (ev) => pagination.onClick(ev, 'previous'),
                    onmouseenter: () => pagination.onMouseHover('previous'),
                    onmouseleave: () => pagination.onMouseHover(undefined),
                });
                this.nextButton ??= ctx.proxyInteractionService.createProxyElement({
                    type: 'button',
                    id: `${this.idPrefix}-next-page`,
                    textContent: { id: 'ariaLabelLegendPageNext' },
                    tabIndex: 0,
                    parent: this.paginationGroup,
                    onclick: (ev) => pagination.onClick(ev, 'next'),
                    onmouseenter: () => pagination.onMouseHover('next'),
                    onmouseleave: () => pagination.onMouseHover(undefined),
                });
                this.paginationGroup.ariaHidden = 'false';
            } else {
                this.nextButton?.remove();
                this.prevButton?.remove();
                this.nextButton = undefined;
                this.prevButton = undefined;
                this.paginationGroup.ariaHidden = 'true';
            }
        }

        const { prev, next } = pagination.computeCSSBounds();

        setElementBBox(this.prevButton, prev);
        setElementBBox(this.nextButton, next);
        this.updatePaginationCursors(params);
    }

    private updatePaginationCursors({ pagination }: LegendDOMProxyPageChangeParams) {
        setElementStyle(this.nextButton, 'cursor', pagination.getCursor('next'));
        setElementStyle(this.prevButton, 'cursor', pagination.getCursor('previous'));
    }

    public onDataUpdate(oldData: CategoryLegendDatum[], newData: CategoryLegendDatum[]) {
        this.dirty =
            oldData.length !== newData.length ||
            oldData.some((_v, index, _a) => {
                const [newValue, oldValue] = [newData[index], oldData[index]];
                return newValue.id !== oldValue.id;
            });
    }

    public onLocaleChanged(
        localeManager: LocaleManager,
        itemSelection: ItemSelection,
        datumReader: CategoryLegendDatumReader
    ) {
        const count = itemSelection.length;
        itemSelection.each(({ proxyButton }, datum, index) => {
            if (proxyButton?.button != null) {
                const label = datumReader.getItemLabel(datum);
                proxyButton.button.textContent = this.getItemAriaText(localeManager, label, index, count);
            }
        });
        this.itemDescription.textContent = this.getItemAriaDescription(localeManager);
    }

    public onPageChange(params: LegendDOMProxyPageChangeParams) {
        this.updateItemProxyButtons(params);
        this.updatePaginationCursors(params);
    }

    private getItemAriaText(
        localeManager: LocaleManager,
        label: string | undefined,
        index: number,
        count: number
    ): string {
        if (index >= 0 && label) {
            index++;
            return localeManager.t('ariaLabelLegendItem', { label, index, count });
        }
        return localeManager.t('ariaLabelLegendItemUnknown');
    }

    private getItemAriaDescription(localeManager: LocaleManager): string {
        return localeManager.t('ariaDescriptionLegendItem');
    }
}
