import type {
    AgToolbarGroupAlignment,
    AgToolbarGroupPosition,
    AgToolbarGroupSize,
    AgToolbarZoomButton,
    AgZoomAnchorPoint,
    AgZoomButtons,
    _Scene,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

import { ZoomRect } from './scenes/zoomRect';
import { ZoomAxisDragger } from './zoomAxisDragger';
import { ZoomContextMenu } from './zoomContextMenu';
import { type ZoomPanUpdate, ZoomPanner } from './zoomPanner';
import { ZoomScrollPanner } from './zoomScrollPanner';
import { ZoomScroller } from './zoomScroller';
import { ZoomSelector } from './zoomSelector';
import { ZoomToolbar } from './zoomToolbar';
import type { DefinedZoomState, ZoomProperties } from './zoomTypes';
import {
    DEFAULT_ANCHOR_POINT_X,
    DEFAULT_ANCHOR_POINT_Y,
    UNIT,
    constrainAxisWithOld,
    constrainZoom,
    definedZoomState,
    dx,
    dy,
    isZoomLess,
    pointToRatio,
    scaleZoomAxisWithPoint,
} from './zoomUtils';

type PinchEvent = _ModuleSupport.PinchEvent;

const {
    ARRAY,
    BOOLEAN,
    NUMBER,
    RATIO,
    REGIONS,
    STRING,
    UNION,
    OR,
    ActionOnSet,
    ChartAxisDirection,
    ChartUpdateType,
    Validate,
    ProxyProperty,
    round: sharedRound,
} = _ModuleSupport;

const round = (value: number) => sharedRound(value, 10);

const ANCHOR_POINT = UNION(['pointer', 'start', 'middle', 'end'], 'an anchor cord');

const CURSOR_ID = 'zoom-cursor';
const TOOLTIP_ID = 'zoom-tooltip';

enum DragState {
    None,
    Axis,
    Pan,
    Select,
}

class ZoomButtonsProperties extends _ModuleSupport.BaseProperties<AgZoomButtons> {
    @_ModuleSupport.ObserveChanges<ZoomButtonsProperties>((target) => {
        target.onChange();
    })
    @Validate(BOOLEAN)
    enabled?: boolean = false;

    @_ModuleSupport.ObserveChanges<ZoomButtonsProperties>((target) => {
        target.onChange();
    })
    @Validate(ARRAY, { optional: true })
    buttons?: Array<AgToolbarZoomButton>;

    @Validate(STRING)
    position?: AgToolbarGroupPosition = 'floating-bottom';

    @Validate(STRING)
    size?: AgToolbarGroupSize = 'small';

    @Validate(STRING)
    align?: AgToolbarGroupAlignment = 'center';

    constructor(private readonly onChange: () => void) {
        super();
    }
}

export class Zoom extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @ActionOnSet<Zoom>({
        newValue(enabled) {
            this.onEnabledChange(enabled);
        },
    })
    @Validate(BOOLEAN)
    public enabled = false;

    @Validate(BOOLEAN)
    public enableAxisDragging = true;

    public buttons = new ZoomButtonsProperties(() => this.onZoomButtonsChange(this.enabled));

    @Validate(BOOLEAN)
    public enableDoubleClickToReset = true;

    @ActionOnSet<Zoom>({
        changeValue(newValue) {
            this.ctx.zoomManager.setIndependentAxes(Boolean(newValue));
        },
    })
    @Validate(BOOLEAN, { optional: true })
    public enableIndependentAxes?: boolean;

    @Validate(BOOLEAN)
    public enablePanning = true;

    @Validate(BOOLEAN)
    public enableScrolling = true;

    @Validate(BOOLEAN)
    public enableSelecting = false;

    @Validate(UNION(['alt', 'ctrl', 'meta', 'shift'], 'a pan key'))
    public panKey: 'alt' | 'ctrl' | 'meta' | 'shift' = 'alt';

    @Validate(UNION(['x', 'y', 'xy'], 'an axis'))
    public axes: 'x' | 'y' | 'xy' = 'x';

    @Validate(RATIO)
    public scrollingStep = (UNIT.max - UNIT.min) / 10;

    @Validate(NUMBER.restrict({ min: 1 }))
    public minVisibleItemsX = 2;

    @Validate(NUMBER.restrict({ min: 1 }))
    public minVisibleItemsY = 2;

    @Validate(ANCHOR_POINT)
    public anchorPointX: AgZoomAnchorPoint = DEFAULT_ANCHOR_POINT_X;

    @Validate(ANCHOR_POINT)
    public anchorPointY: AgZoomAnchorPoint = DEFAULT_ANCHOR_POINT_Y;

    // Scenes
    private seriesRect?: _Scene.BBox;
    private paddedRect?: _Scene.BBox;

    // Zoom methods
    private readonly axisDragger = new ZoomAxisDragger();
    private readonly contextMenu: ZoomContextMenu;
    private readonly panner = new ZoomPanner();
    private readonly selector: ZoomSelector;
    private readonly scroller = new ZoomScroller();
    private readonly scrollPanner = new ZoomScrollPanner();
    private readonly toolbar: ZoomToolbar;

    @ProxyProperty('panner.deceleration')
    @Validate(OR(RATIO, UNION(['off', 'short', 'long'], 'a deceleration')))
    deceleration: number | 'off' | 'short' | 'long' = 'short';

    // State
    private dragState = DragState.None;
    private hoveredAxis?: { id: string; direction: _ModuleSupport.ChartAxisDirection };
    private shouldFlipXY?: boolean;
    private minRatioX = 0;
    private minRatioY = 0;

    private destroyContextMenuActions: (() => void) | undefined = undefined;

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        const selectionRect = new ZoomRect();
        this.selector = new ZoomSelector(selectionRect);
        this.contextMenu = new ZoomContextMenu(
            ctx.contextMenuRegistry,
            ctx.zoomManager,
            this.getModuleProperties.bind(this),
            () => this.paddedRect,
            this.updateZoom.bind(this)
        );
        this.toolbar = new ZoomToolbar(
            ctx.toolbarManager,
            ctx.zoomManager,
            this.getResetZoom.bind(this),
            this.updateUnifiedZoom.bind(this),
            this.updateAxisZoom.bind(this)
        );

        const { Default, ZoomDrag, Animation, Annotations, AnnotationsSelected } = _ModuleSupport.InteractionState;
        const draggableState = Default | Animation | ZoomDrag;
        const clickableState = Default | Animation;
        const wheelableState = draggableState | Annotations | AnnotationsSelected;
        const region = ctx.regionManager.getRegion(REGIONS.SERIES);
        const horizontalAxesRegion = ctx.regionManager.getRegion(REGIONS.HORIZONTAL_AXES);
        const verticalAxesRegion = ctx.regionManager.getRegion(REGIONS.VERTICAL_AXES);

        const dragStartEventType = 'drag-start';
        this.destroyFns.push(
            ctx.scene.attachNode(selectionRect),
            ctx.regionManager.listenAll('dblclick', (event) => this.onDoubleClick(event), clickableState),
            ctx.keyNavManager.addListener('nav-zoom', (event) => this.onNavZoom(event)),
            region.addListener('drag', (event) => this.onDrag(event), draggableState),
            region.addListener(dragStartEventType, (event) => this.onDragStart(event), draggableState),
            region.addListener('drag-end', (event) => this.onDragEnd(event), draggableState),
            verticalAxesRegion.addListener('drag', (event) => this.onDrag(event), draggableState),
            verticalAxesRegion.addListener(dragStartEventType, (event) => this.onDragStart(event), draggableState),
            verticalAxesRegion.addListener('drag-end', (event) => this.onDragEnd(event), draggableState),
            verticalAxesRegion.addListener('leave', () => this.onAxisLeave(), clickableState),
            verticalAxesRegion.addListener('hover', (event) => this.onAxisHover(event, ChartAxisDirection.Y)),
            horizontalAxesRegion.addListener('drag', (event) => this.onDrag(event), draggableState),
            horizontalAxesRegion.addListener(dragStartEventType, (event) => this.onDragStart(event), draggableState),
            horizontalAxesRegion.addListener('drag-end', (event) => this.onDragEnd(event), draggableState),
            horizontalAxesRegion.addListener('leave', () => this.onAxisLeave(), clickableState),
            horizontalAxesRegion.addListener('hover', (event) => this.onAxisHover(event, ChartAxisDirection.X)),
            region.addListener('wheel', (event) => this.onWheel(event), wheelableState),
            ctx.gestureDetector.addListener('pinch-move', (event) => this.onPinchMove(event as PinchEvent)),
            ctx.toolbarManager.addListener('button-pressed', (event) =>
                this.toolbar.onButtonPress(event, this.getModuleProperties())
            ),
            ctx.layoutManager.addListener('layout:complete', (event) => this.onLayoutComplete(event)),
            ctx.updateService.addListener('update-complete', (event) => this.onUpdateComplete(event)),
            ctx.zoomManager.addListener('zoom-change', (event) => this.onZoomChange(event)),
            ctx.zoomManager.addListener('zoom-pan-start', (event) => this.onZoomPanStart(event)),
            this.panner.addListener('update', (event) => this.onPanUpdate(event)),
            () => this.toolbar.destroy()
        );
    }

    override destroy(): void {
        super.destroy();
        this.destroyContextMenuActions?.();
    }

    private onEnabledChange(enabled: boolean) {
        if (!this.contextMenu || !this.toolbar) return;

        this.ctx.zoomManager.setZoomModuleEnabled(enabled);
        const zoom = this.getZoom();
        const props = this.getModuleProperties({ enabled });
        this.destroyContextMenuActions?.();
        this.destroyContextMenuActions = this.contextMenu.registerActions(enabled, zoom);
        this.onZoomButtonsChange(enabled);
        this.toolbar.toggle(enabled, zoom, props);
    }

    private onZoomButtonsChange(zoomEnabled: boolean) {
        if (!this.buttons) return;
        const buttonsJson = this.buttons.toJson();
        buttonsJson.enabled &&= zoomEnabled;
        this.ctx.toolbarManager.proxyGroupOptions('zoom', 'zoom', buttonsJson);
    }

    private onDoubleClick(event: _ModuleSupport.RegionEvent<'dblclick'> & { preventZoomDblClick?: boolean }) {
        const { enabled, enableDoubleClickToReset, hoveredAxis } = this;

        if (!enabled || !enableDoubleClickToReset) return;

        const zoom = this.getResetZoom();

        if (hoveredAxis) {
            const { id, direction } = hoveredAxis;
            this.updateAxisZoom(id, direction, zoom[direction]);
        } else if (!event.preventZoomDblClick) {
            this.updateZoom(zoom);
        }
    }

    private onDragStart(event: _ModuleSupport.RegionEvent<'drag-start'>) {
        const {
            enabled,
            enableAxisDragging,
            enablePanning,
            enableSelecting,
            hoveredAxis,
            ctx: { cursorManager, zoomManager },
        } = this;

        if (!enabled || event.button !== 0) return;

        this.panner.stopInteractions();

        // Determine which ZoomDrag behaviour to use.
        let newDragState = DragState.None;

        if (enableAxisDragging && hoveredAxis) {
            newDragState = DragState.Axis;
        } else {
            const panKeyPressed = this.isPanningKeyPressed(event.sourceEvent as DragEvent);
            // Allow panning if either selection is disabled or the panning key is pressed.
            if (enablePanning && (!enableSelecting || panKeyPressed)) {
                cursorManager.updateCursor(CURSOR_ID, 'grabbing');
                newDragState = DragState.Pan;
                this.panner.start();
            } else if (enableSelecting) {
                const fullyZoomedIn = this.isMinZoom(this.getZoom());
                // Do not allow selection if fully zoomed in or when the pankey is pressed
                if (!fullyZoomedIn && !panKeyPressed) {
                    newDragState = DragState.Select;
                }
            }
        }

        if ((this.dragState = newDragState) !== DragState.None) {
            zoomManager.fireZoomPanStartEvent('zoom');
        }
    }

    private onDrag(event: _ModuleSupport.RegionEvent<'drag'>) {
        const {
            anchorPointX,
            anchorPointY,
            axisDragger,
            dragState,
            enabled,
            paddedRect,
            panner,
            selector,
            seriesRect,
            hoveredAxis,
            ctx: { interactionManager, tooltipManager, updateService, zoomManager },
        } = this;

        if (!enabled || !paddedRect || !seriesRect) return;

        interactionManager.pushState(_ModuleSupport.InteractionState.ZoomDrag);

        const zoom = this.getZoom();

        switch (dragState) {
            case DragState.Axis: {
                if (!hoveredAxis) break;

                const { id: axisId, direction } = hoveredAxis;
                const anchor = direction === _ModuleSupport.ChartAxisDirection.X ? anchorPointX : anchorPointY;
                const axisZoom = zoomManager.getAxisZoom(axisId);
                const newZoom = axisDragger.update(event, direction, anchor, seriesRect, zoom, axisZoom);
                this.updateAxisZoom(axisId, direction, newZoom);
                break;
            }

            case DragState.Pan:
                panner.update(event);
                break;

            case DragState.Select:
                selector.update(event, this.getModuleProperties(), paddedRect, zoom);
                break;

            case DragState.None:
                return;
        }

        tooltipManager.updateTooltip(TOOLTIP_ID);
        updateService.update(ChartUpdateType.PERFORM_LAYOUT, { skipAnimations: true });
    }

    private onDragEnd(_event: _ModuleSupport.RegionEvent<'drag-end'>) {
        const {
            axisDragger,
            dragState,
            enabled,
            panner,
            selector,
            ctx: { cursorManager, interactionManager, tooltipManager },
        } = this;

        interactionManager.popState(_ModuleSupport.InteractionState.ZoomDrag);

        // Stop single clicks from triggering drag end and resetting the zoom
        if (!enabled || dragState === DragState.None) return;

        switch (dragState) {
            case DragState.Axis:
                axisDragger.stop();
                break;

            case DragState.Pan:
                panner.stop();
                break;

            case DragState.Select: {
                if (!selector.didUpdate()) break;
                const zoom = this.getZoom();
                if (this.isMinZoom(zoom)) break;
                const newZoom = selector.stop(this.seriesRect, this.paddedRect, zoom);
                this.updateZoom(newZoom);
                break;
            }
        }

        this.dragState = DragState.None;
        cursorManager.updateCursor(CURSOR_ID);
        tooltipManager.removeTooltip(TOOLTIP_ID);
    }

    private onNavZoom(event: _ModuleSupport.KeyNavEvent<'nav-zoom'>) {
        const { enabled, enableScrolling, scroller } = this;

        if (!enabled || !enableScrolling) return;
        event.preventDefault();

        this.updateZoom(scroller.updateDelta(event.delta, this.getModuleProperties(), this.getZoom()));
    }

    private onWheel(event: _ModuleSupport.RegionEvent<'wheel'>) {
        const { enabled, enablePanning, enableScrolling, paddedRect } = this;

        if (!enabled || !enableScrolling || !paddedRect) return;

        const sourceEvent = event.sourceEvent as WheelEvent;
        const { deltaX, deltaY } = sourceEvent;
        const isHorizontalScrolling = deltaX != null && deltaY != null && Math.abs(deltaX) > Math.abs(deltaY);

        if (enablePanning && isHorizontalScrolling) {
            this.onWheelPanning(event);
        } else {
            this.onWheelScrolling(event);
        }
    }

    private onWheelPanning(event: _ModuleSupport.RegionEvent<'wheel'>) {
        const {
            scrollingStep,
            scrollPanner,
            seriesRect,
            ctx: { zoomManager },
        } = this;

        if (!seriesRect) return;

        event.preventDefault();

        const newZooms = scrollPanner.update(event, scrollingStep, seriesRect, zoomManager.getAxisZooms());
        for (const [axisId, { direction, zoom }] of Object.entries(newZooms)) {
            this.updateAxisZoom(axisId, direction, zoom);
        }
    }

    private onWheelScrolling(event: _ModuleSupport.RegionEvent<'wheel'>) {
        const {
            enableAxisDragging,
            enableIndependentAxes,
            hoveredAxis,
            scroller,
            seriesRect,
            ctx: { zoomManager },
        } = this;

        if (!seriesRect) return;

        event.preventDefault();

        const isAxisScrolling = enableAxisDragging && hoveredAxis != null;

        let isScalingX = this.isScalingX();
        let isScalingY = this.isScalingY();

        if (isAxisScrolling) {
            isScalingX = hoveredAxis.direction === _ModuleSupport.ChartAxisDirection.X;
            isScalingY = !isScalingX;
        }

        const props = this.getModuleProperties({ isScalingX, isScalingY });

        if (enableIndependentAxes === true) {
            const newZooms = scroller.updateAxes(event, props, seriesRect, zoomManager.getAxisZooms());
            for (const [axisId, { direction, zoom }] of Object.entries(newZooms)) {
                if (isAxisScrolling && hoveredAxis.id !== axisId) continue;
                this.updateAxisZoom(axisId, direction, zoom);
            }
        } else {
            const newZoom = scroller.update(event, props, seriesRect, this.getZoom());
            this.updateUnifiedZoom(newZoom);
        }
    }

    private onAxisLeave() {
        const {
            enabled,
            ctx: { cursorManager },
        } = this;

        if (!enabled) return;

        this.hoveredAxis = undefined;
        cursorManager.updateCursor(CURSOR_ID);
    }

    private onAxisHover(event: _ModuleSupport.RegionEvent, direction: _ModuleSupport.ChartAxisDirection) {
        const {
            enabled,
            enableAxisDragging,
            ctx: { cursorManager },
        } = this;

        if (!enabled) return;

        this.hoveredAxis = {
            id: event.bboxProviderId ?? 'unknown',
            direction,
        };

        if (enableAxisDragging) {
            cursorManager.updateCursor(CURSOR_ID, direction === ChartAxisDirection.X ? 'ew-resize' : 'ns-resize');
        }
    }

    private onPinchMove(event: PinchEvent) {
        const { enabled, enableScrolling, paddedRect, seriesRect } = this;
        if (!enabled || !enableScrolling || !paddedRect || !seriesRect) return;

        const oldZoom = this.getZoom();
        const newZoom = definedZoomState(oldZoom);

        const delta = event.deltaDistance * -0.01;
        const origin = pointToRatio(seriesRect, event.origin.x, event.origin.y);

        if (this.isScalingX()) {
            newZoom.x.max += delta * dx(oldZoom);
            newZoom.x = scaleZoomAxisWithPoint(newZoom.x, oldZoom.x, origin.x);
        }
        if (this.isScalingY()) {
            newZoom.y.max += delta * (oldZoom.y.max - oldZoom.y.min);
            newZoom.y = scaleZoomAxisWithPoint(newZoom.y, oldZoom.y, origin.y);
        }

        this.updateZoom(constrainZoom(newZoom));
        event.preventDefault();
    }

    private onLayoutComplete(event: _ModuleSupport.LayoutCompleteEvent) {
        const { enabled } = this;

        if (!enabled) return;

        const {
            series: { rect, paddedRect, shouldFlipXY },
        } = event;

        this.seriesRect = rect;
        this.paddedRect = paddedRect;
        this.shouldFlipXY = shouldFlipXY;
    }

    private onUpdateComplete(event: { minRect?: _Scene.BBox; minVisibleRect?: _Scene.BBox }) {
        const { minRect, minVisibleRect } = event;
        const { enabled, minVisibleItemsX, minVisibleItemsY, paddedRect, shouldFlipXY } = this;

        if (!enabled || !paddedRect || !minRect || !minVisibleRect) return;

        const zoom = this.getZoom();

        const minVisibleItemsWidth = shouldFlipXY ? minVisibleItemsY : minVisibleItemsX;
        const minVisibleItemsHeight = shouldFlipXY ? minVisibleItemsX : minVisibleItemsY;

        const widthRatio = (minVisibleRect.width * minVisibleItemsWidth) / paddedRect.width;
        const heightRatio = (minVisibleRect.height * minVisibleItemsHeight) / paddedRect.height;

        // Round the ratios to reduce jiggle from floating point precision limitations
        const ratioX = round(widthRatio * dx(zoom));
        const ratioY = round(heightRatio * dy(zoom));

        if (this.isScalingX()) {
            this.minRatioX = Math.min(1, ratioX);
        }

        if (this.isScalingY()) {
            this.minRatioY = Math.min(1, ratioY);
        }

        this.minRatioX ||= this.minRatioY || 0;
        this.minRatioY ||= this.minRatioX || 0;
    }

    private onZoomChange(event: _ModuleSupport.ZoomChangeEvent) {
        if (event.callerId !== 'zoom') {
            this.panner.stopInteractions();
        }

        const zoom = this.getZoom();
        const props = this.getModuleProperties();
        this.contextMenu.toggleActions(zoom);
        this.toolbar.toggleButtons(zoom, props);
    }

    private onZoomPanStart(event: _ModuleSupport.ZoomPanStartEvent): void {
        if (event.callerId === 'zoom') {
            this.panner.stopInteractions();
        }
    }

    private onPanUpdate(event: ZoomPanUpdate) {
        const {
            panner,
            seriesRect,
            ctx: { tooltipManager, zoomManager },
        } = this;

        if (!seriesRect) return;

        const newZooms = panner.translateZooms(seriesRect, zoomManager.getAxisZooms(), event.deltaX, event.deltaY);

        for (const [axisId, { direction, zoom }] of Object.entries(newZooms)) {
            this.updateAxisZoom(axisId, direction, zoom);
        }

        tooltipManager.updateTooltip(TOOLTIP_ID);
    }

    private isPanningKeyPressed(event: MouseEvent | WheelEvent) {
        switch (this.panKey) {
            case 'alt':
                return event.altKey;
            case 'ctrl':
                return event.ctrlKey;
            case 'shift':
                return event.shiftKey;
            case 'meta':
                return event.metaKey;
        }
    }

    private isScalingX() {
        if (this.axes === 'xy') return true;
        return this.shouldFlipXY ? this.axes === 'y' : this.axes === 'x';
    }

    private isScalingY() {
        if (this.axes === 'xy') return true;
        return this.shouldFlipXY ? this.axes === 'x' : this.axes === 'y';
    }

    private getAnchorPointX() {
        return this.shouldFlipXY ? this.anchorPointY : this.anchorPointX;
    }

    private getAnchorPointY() {
        return this.shouldFlipXY ? this.anchorPointX : this.anchorPointY;
    }

    private isMinZoom(zoom: DefinedZoomState): boolean {
        return isZoomLess(zoom, this.minRatioX, this.minRatioY);
    }

    private updateZoom(zoom: DefinedZoomState) {
        if (this.enableIndependentAxes) {
            this.updatePrimaryAxisZooms(zoom);
        } else {
            this.updateUnifiedZoom(zoom);
        }
    }

    private updatePrimaryAxisZooms(zoom: DefinedZoomState) {
        this.ctx.zoomManager.updatePrimaryAxisZoom('zoom', ChartAxisDirection.X, zoom.x);
        this.ctx.zoomManager.updatePrimaryAxisZoom('zoom', ChartAxisDirection.Y, zoom.y);
    }

    private updateUnifiedZoom(zoom: DefinedZoomState) {
        const {
            minRatioX,
            minRatioY,
            ctx: { zoomManager },
        } = this;
        const dx_ = dx(zoom);
        const dy_ = dy(zoom);

        const oldZoom = this.getZoom();

        const zoomedInTooFarX = dx_ <= dx(oldZoom) && dx_ < minRatioX;
        const zoomedInTooFarY = dy_ <= dy(oldZoom) && dy_ < minRatioY;

        if (zoomedInTooFarX) {
            zoom.x = constrainAxisWithOld(zoom.x, oldZoom.x, minRatioX);
        }

        if (zoomedInTooFarY) {
            zoom.y = constrainAxisWithOld(zoom.y, oldZoom.y, minRatioY);
        }

        zoomManager.updateZoom('zoom', zoom);
    }

    private updateAxisZoom(
        axisId: string,
        direction: _ModuleSupport.ChartAxisDirection,
        axisZoom: _ModuleSupport.ZoomState | undefined
    ) {
        const {
            enableIndependentAxes,
            minRatioX,
            minRatioY,
            ctx: { zoomManager },
        } = this;

        if (!axisZoom) return;

        const zoom = this.getZoom();

        if (enableIndependentAxes !== true) {
            zoom[direction] = axisZoom;
            this.updateUnifiedZoom(zoom);
            return;
        }

        const deltaAxis = axisZoom.max - axisZoom.min;
        const deltaOld = zoom[direction].max - zoom[direction].min;
        const minRatio = direction === ChartAxisDirection.X ? minRatioX : minRatioY;

        if (deltaAxis <= deltaOld && deltaAxis < minRatio) {
            return;
        }

        zoomManager.updateAxisZoom('zoom', axisId, axisZoom);
    }

    private getZoom() {
        return definedZoomState(this.ctx.zoomManager.getZoom());
    }

    private getResetZoom() {
        return definedZoomState(this.ctx.zoomManager.getRestoredZoom());
    }

    private getModuleProperties(overrides?: Partial<ZoomProperties>): ZoomProperties {
        return {
            anchorPointX: overrides?.anchorPointX ?? this.getAnchorPointX(),
            anchorPointY: overrides?.anchorPointY ?? this.getAnchorPointY(),
            enabled: overrides?.enabled ?? this.enabled,
            independentAxes: overrides?.independentAxes ?? this.enableIndependentAxes === true,
            isScalingX: overrides?.isScalingX ?? this.isScalingX(),
            isScalingY: overrides?.isScalingY ?? this.isScalingY(),
            minRatioX: overrides?.minRatioX ?? this.minRatioX,
            minRatioY: overrides?.minRatioY ?? this.minRatioY,
            scrollingStep: overrides?.scrollingStep ?? this.scrollingStep,
        };
    }
}
