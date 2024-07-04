import type { FontStyle, FontWeight, TextAlign, TextWrap } from 'ag-charts-types';

import type { ModuleContext } from '../module/moduleContext';
import { PointerEvents } from '../scene/node';
import { Text } from '../scene/shape/text';
import { joinFunctions } from '../util/function';
import { createId } from '../util/id';
import { BaseProperties } from '../util/properties';
import { ProxyPropertyOnWrite } from '../util/proxy';
import { TextMeasurer } from '../util/textMeasurer';
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
    readonly node = new Text({ zIndex: 1 }).setProperties({
        textAlign: 'center',
        pointerEvents: PointerEvents.None,
    });

    @Validate(BOOLEAN)
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
    lineHeight?: number;

    @Validate(POSITIVE_NUMBER, { optional: true })
    maxWidth?: number;

    @Validate(POSITIVE_NUMBER, { optional: true })
    maxHeight?: number;

    @Validate(TEXT_WRAP)
    wrapping: TextWrap = 'always';

    private truncated = false;

    @Validate(STRING)
    layoutStyle: 'block' | 'overlay' = 'block';

    registerInteraction(moduleCtx: ModuleContext) {
        const region = moduleCtx.regionManager.getRegion('root');
        const destroyFns = [
            region.addListener('hover', (event) => this.handleMouseMove(moduleCtx, event)),
            region.addListener('leave', (event) => this.handleMouseLeave(moduleCtx, event)),
        ];

        return joinFunctions(...destroyFns);
    }

    computeTextWrap(containerWidth: number, containerHeight: number) {
        const { text, wrapping } = this;
        const maxWidth = Math.min(this.maxWidth ?? Infinity, containerWidth);
        const maxHeight = this.maxHeight ?? containerHeight;
        if (!isFinite(maxWidth) && !isFinite(maxHeight)) {
            this.node.text = text;
            return;
        }
        const wrappedText = TextWrapper.wrapText(text ?? '', { maxWidth, maxHeight, font: this, textWrap: wrapping });
        this.node.text = wrappedText;
        this.truncated = wrappedText.includes(TextMeasurer.EllipsisChar);
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
