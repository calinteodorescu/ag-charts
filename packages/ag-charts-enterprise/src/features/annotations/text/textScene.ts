import { _Scene } from 'ag-charts-community';

import type { AnnotationContext, Coords } from '../annotationTypes';
import { convertPoint, invertCoords } from '../annotationUtils';
import { AnnotationScene } from '../scenes/annotationScene';
import { DivariantHandle } from '../scenes/handle';
import type { TextProperties } from './textProperties';

export class TextScene extends AnnotationScene {
    static override is(value: unknown): value is TextScene {
        return AnnotationScene.isCheck(value, 'text');
    }

    override type = 'text';
    override activeHandle?: string | undefined;

    private readonly label = new _Scene.Text();
    private readonly handle = new DivariantHandle();

    constructor() {
        super();
        this.append([this.label, this.handle]);
    }

    public update(datum: TextProperties, context: AnnotationContext) {
        const coords = convertPoint(datum, context);

        this.visible = datum.visible ?? true;

        this.label.x = coords.x;
        this.label.y = coords.y;
        this.label.text = datum.text;

        this.label.fontFamily = datum.fontFamily;
        this.label.fontSize = datum.fontSize;
        this.label.fontStyle = datum.fontStyle;
        this.label.fontWeight = datum.fontWeight;
        this.label.textAlign = datum.alignment;
        this.label.textBaseline = datum.position == 'center' ? 'middle' : datum.position;

        const handleStyles = {
            fill: datum.handle.fill,
            stroke: datum.handle.stroke,
            strokeOpacity: datum.handle.strokeOpacity,
            strokeWidth: datum.handle.strokeWidth,
        };

        let bbox = this.getCachedBBoxWithoutHandles();
        if (bbox.width === 0 && bbox.height === 0) {
            bbox = this.computeBBoxWithoutHandles();
        }
        this.handle.update({
            ...handleStyles,
            x: coords.x + bbox.width / 2,
            y: coords.y + bbox.height + DivariantHandle.HANDLE_SIZE,
        });
    }

    public drag(datum: TextProperties, target: Coords, context: AnnotationContext) {
        if (datum.locked || this.activeHandle == null) return;

        this.handle.toggleDragging(true);
        const bbox = this.getCachedBBoxWithoutHandles();
        const offsetTarget = {
            x: target.x - bbox.width / 2,
            y: target.y - (bbox.height + DivariantHandle.HANDLE_SIZE),
        };
        const point = invertCoords(this.handle.drag(offsetTarget).point, context);

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
}
