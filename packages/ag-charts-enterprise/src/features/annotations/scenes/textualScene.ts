import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import type { AnnotationContext, Coords } from '../annotationTypes';
import { convertPoint, invertCoords } from '../annotationUtils';
import type { TextualProperties } from '../properties/textualProperties';
import { AnnotationScene } from '../scenes/annotationScene';
import { DivariantHandle } from './handle';

const { Vec2 } = _Util;

interface AnchoredLayout {
    alignment: 'left' | 'center' | 'right';
    placement: 'inside' | 'outside';
    position: 'top' | 'center' | 'bottom';
    spacing: number;
}

export abstract class TextualScene<Datum extends TextualProperties> extends AnnotationScene {
    protected readonly label = new _Scene.Text();
    protected readonly handle = new DivariantHandle();

    override activeHandle?: string | undefined;

    protected dragState?: {
        offset: Coords;
        handle: Coords;
    };

    public update(datum: Datum, context: AnnotationContext) {
        this.visible = datum.visible ?? true;

        const textBBox = datum.getTextBBox(context);

        this.updateLabel(datum, textBBox);
        this.updateHandle(datum);
        this.updateShape(datum);
    }

    public dragStart(datum: Datum, target: Coords, context: AnnotationContext) {
        this.dragState = {
            offset: target,
            handle: convertPoint(datum, context),
        };
    }

    public drag(datum: Datum, target: Coords, context: AnnotationContext) {
        const { dragState } = this;

        if (datum.locked || !dragState) return;

        const coords = Vec2.add(dragState.handle, Vec2.sub(target, dragState.offset));
        const point = invertCoords(coords, context);

        datum.x = point.x;
        datum.y = point.y;
    }

    override toggleHandles(show: boolean | Partial<Record<'handle', boolean>>) {
        this.handle.visible = Boolean(show);
        this.handle.toggleHovered(this.activeHandle === 'handle');
    }

    override toggleActive(active: boolean) {
        this.toggleHandles(active);
        this.handle.toggleActive(active);
    }

    override stopDragging() {
        this.handle.toggleDragging(false);
    }

    override getAnchor() {
        const bbox = this.getCachedBBoxWithoutHandles();
        return { x: bbox.x + bbox.width / 2, y: bbox.y };
    }

    override getCursor() {
        if (this.activeHandle == null) return 'pointer';
        return 'default';
    }

    override containsPoint(x: number, y: number) {
        const { handle, label } = this;

        this.activeHandle = undefined;

        if (handle.containsPoint(x, y)) {
            this.activeHandle = 'handle';
            return true;
        }

        return label.containsPoint(x, y);
    }

    protected updateLabel(datum: Datum, textBBox: _Scene.BBox) {
        const position = datum.position ?? 'top';
        const alignment = datum.alignment ?? 'left';

        const { x, y } = this.getCoordsFromAnchoredLayout(
            { alignment, placement: 'inside', position, spacing: 0 },
            textBBox
        );

        this.label.x = x - textBBox.width / 2;
        this.label.y = y - textBBox.height / 2;
        this.label.textBaseline = position == 'center' ? 'middle' : position;

        this.label.text = datum.text;
        this.label.fill = datum.color;
        this.label.fontFamily = datum.fontFamily;
        this.label.fontSize = datum.fontSize;
        this.label.fontStyle = datum.fontStyle;
        this.label.fontWeight = datum.fontWeight;
        this.label.textAlign = alignment;
    }

    protected updateHandle(datum: Datum) {
        let bbox = this.label.getCachedBBox();
        if (bbox.width === 0 && bbox.height === 0) {
            bbox = this.label.computeBBox();
        }

        const { x, y } = this.getCoordsFromAnchoredLayout(
            {
                alignment: 'center',
                placement: 'outside',
                position: 'bottom',
                spacing: DivariantHandle.HANDLE_SIZE,
            },
            bbox
        );

        const styles = {
            fill: datum.handle.fill,
            stroke: datum.handle.stroke,
            strokeOpacity: datum.handle.strokeOpacity,
            strokeWidth: datum.handle.strokeWidth,
        };

        this.handle.update({ ...styles, x, y });
    }

    protected updateShape(_datum: Datum) {
        // Shapes should be implemented by the extending annotation type class
    }

    protected getCoordsFromAnchoredLayout(layout: AnchoredLayout, bbox: _Scene.BBox) {
        const { alignment, placement, position, spacing } = layout;

        let x = bbox.x;
        let y = bbox.y;

        const placementModifier = placement === 'inside' ? 1 : -1;
        const placedSpacing = spacing * placementModifier;

        switch (alignment) {
            case 'left':
                x = bbox.x + placedSpacing;
                break;
            case 'center':
                x = bbox.x + bbox.width / 2;
                break;
            case 'right':
                x = bbox.x + bbox.width - placedSpacing;
                break;
        }

        switch (position) {
            case 'top':
                y = bbox.y + placedSpacing;
                break;
            case 'center':
                y = bbox.y + bbox.height / 2;
                break;
            case 'bottom':
                y = bbox.y + bbox.height - placedSpacing;
                break;
        }

        return { x, y };
    }
}