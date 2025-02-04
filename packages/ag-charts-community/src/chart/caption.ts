import type { FontStyle, FontWeight, TextAlign, TextWrap } from 'ag-charts-types';

import type { BoundedText } from '../dom/boundedText';
import type { ProxyInteractionService } from '../dom/proxyInteractionService';
import type { ModuleContext } from '../module/moduleContext';
import { PointerEvents } from '../scene/node';
import { RotatableText } from '../scene/shape/text';
import { Transformable } from '../scene/transformable';
import { joinFunctions } from '../util/function';
import { createId } from '../util/id';
import { BaseProperties } from '../util/properties';
import { ProxyPropertyOnWrite } from '../util/proxy';
import { TextUtils } from '../util/textMeasurer';
import { TextWrapper } from '../util/textWrapper';
import {
    BOOLEAN,
    COLOR_STRING,
    FONT_STYLE,
    FONT_WEIGHT,
    POSITIVE_NUMBER,
    STRING,
    TEXT_ALIGN,
    TEXT_WRAP,
    Validate,
} from '../util/validation';
import type { CaptionLike } from './captionLike';
import type { PointerInteractionEvent } from './interaction/interactionManager';
import { toTooltipHtml } from './tooltip/tooltip';

export class Caption extends BaseProperties implements CaptionLike {
    static readonly SMALL_PADDING = 10;
    static readonly LARGE_PADDING = 20;

    readonly id = createId(this);
    readonly node = new RotatableText({ zIndex: 1 }).setProperties({
        textAlign: 'center',
        pointerEvents: PointerEvents.None,
    });

    @Validate(BOOLEAN)
    @ProxyPropertyOnWrite('node', 'visible')
    enabled: boolean = false;

    @Validate(STRING, { optional: true })
    @ProxyPropertyOnWrite('node')
    text?: string;

    @Validate(TEXT_ALIGN, { optional: true })
    @ProxyPropertyOnWrite('node')
    textAlign: TextAlign = 'center';

    @Validate(FONT_STYLE, { optional: true })
    @ProxyPropertyOnWrite('node')
    fontStyle?: FontStyle;

    @Validate(FONT_WEIGHT, { optional: true })
    @ProxyPropertyOnWrite('node')
    fontWeight?: FontWeight;

    @Validate(POSITIVE_NUMBER)
    @ProxyPropertyOnWrite('node')
    fontSize: number = 10;

    @Validate(STRING)
    @ProxyPropertyOnWrite('node')
    fontFamily: string = 'sans-serif';

    @Validate(COLOR_STRING, { optional: true })
    @ProxyPropertyOnWrite('node', 'fill')
    color?: string;

    @Validate(POSITIVE_NUMBER, { optional: true })
    spacing?: number;

    @Validate(POSITIVE_NUMBER, { optional: true })
    maxWidth?: number;

    @Validate(POSITIVE_NUMBER, { optional: true })
    maxHeight?: number;

    @Validate(TEXT_WRAP)
    wrapping: TextWrap = 'always';

    @Validate(POSITIVE_NUMBER)
    padding: number = 0;

    @Validate(STRING)
    layoutStyle: 'block' | 'overlay' = 'block';

    private truncated = false;
    private proxyText?: BoundedText;

    registerInteraction(moduleCtx: ModuleContext, where: 'beforebegin' | 'afterend') {
        const { regionManager, proxyInteractionService, layoutManager } = moduleCtx;
        const region = regionManager.getRegion('root');
        const destroyFns = [
            layoutManager.addListener('layout:complete', () => this.updateA11yText(proxyInteractionService, where)),
            region.addListener('hover', (event) => this.handleMouseMove(moduleCtx, event)),
            region.addListener('leave', (event) => this.handleMouseLeave(moduleCtx, event)),
        ];

        return joinFunctions(...destroyFns);
    }

    computeTextWrap(containerWidth: number, containerHeight: number) {
        const { text, padding, wrapping } = this;
        const maxWidth = Math.min(this.maxWidth ?? Infinity, containerWidth) - padding * 2;
        const maxHeight = this.maxHeight ?? containerHeight - padding * 2;
        if (!isFinite(maxWidth) && !isFinite(maxHeight)) {
            this.node.text = text;
            return;
        }
        const wrappedText = TextWrapper.wrapText(text ?? '', { maxWidth, maxHeight, font: this, textWrap: wrapping });
        this.node.text = wrappedText;
        this.truncated = wrappedText.includes(TextUtils.EllipsisChar);
    }

    updateA11yText(proxyService: ProxyInteractionService, where: 'beforebegin' | 'afterend') {
        if (this.enabled && this.text) {
            const bbox = Transformable.toCanvas(this.node);
            if (bbox) {
                const { id } = this;
                this.proxyText ??= proxyService.createProxyElement({ type: 'text', id, parent: where });
                this.proxyText.textContent = this.text;
                this.proxyText.updateBounds(bbox);
            }
        } else {
            this.proxyText?.remove();
            this.proxyText = undefined;
        }
    }

    handleMouseMove(moduleCtx: ModuleContext, event: PointerInteractionEvent<'hover'>) {
        if (event !== undefined && this.enabled && this.node.visible && this.truncated) {
            const { offsetX, offsetY } = event;
            moduleCtx.tooltipManager.updateTooltip(
                this.id,
                { offsetX, offsetY, lastPointerEvent: event, showArrow: false },
                toTooltipHtml({ content: this.text })
            );
        }
    }

    handleMouseLeave(moduleCtx: ModuleContext, _event: PointerInteractionEvent<'leave'>) {
        moduleCtx.tooltipManager.removeTooltip(this.id);
    }
}
