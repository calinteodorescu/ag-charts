import type { PixelSize } from 'ag-charts-community';

import type {
    AnnotationLineStyle,
    AnnotationLineStyleType,
    AnnotationOptionsColorPickerType,
    AnnotationType,
    ChannelAnnotationType,
    LineAnnotationType,
    TextualAnnotationType,
} from '../annotationTypes';
import type {
    AnnotationProperties,
    ChannelPropertiesType,
    LinePropertiesType,
    TextualPropertiesType,
} from '../annotationsSuperTypes';
import { NoteProperties } from '../note/noteProperties';
import { hasFontSize, hasLineStyle } from './has';

export function setDefaults({
    datum,
    defaultColors,
    defaultFontSizes,
    defaultLineStyles,
}: {
    datum: AnnotationProperties;
    defaultColors: Map<AnnotationType, Map<AnnotationOptionsColorPickerType, [string, string, number] | undefined>>;
    defaultFontSizes: Map<TextualAnnotationType, number | undefined>;
    defaultLineStyles: Map<LineAnnotationType | ChannelAnnotationType, AnnotationLineStyle | undefined>;
}) {
    for (const [annotationType, colors] of defaultColors) {
        if (datum.type !== annotationType) {
            continue;
        }

        for (const [colorPickerType, [colorOpacity, color, opacity] = []] of colors) {
            if (colorOpacity && color && opacity != null) {
                setColor(datum, colorPickerType, colorOpacity, color, opacity);
            }
        }
    }

    if (hasFontSize(datum)) {
        for (const [annotationType, size] of defaultFontSizes) {
            if (size) {
                setFontSize(datum, annotationType, size);
            }
        }
    }

    if (hasLineStyle(datum)) {
        for (const [annotationType, style] of defaultLineStyles) {
            if (style) {
                setLineStyle(datum, annotationType, style);
            }
        }
    }
}

export function setFontSize(datum: TextualPropertiesType, annotationType: TextualAnnotationType, fontSize: number) {
    if (datum.type === annotationType && 'fontSize' in datum) {
        datum.fontSize = fontSize;
    }
}

export function setLineStyle(
    datum: LinePropertiesType | ChannelPropertiesType,
    annotationType: LineAnnotationType | ChannelAnnotationType,
    style: AnnotationLineStyle
) {
    if (!(datum.type === annotationType)) {
        return;
    }

    const strokeWidth = style.strokeWidth ?? datum.strokeWidth ?? 1;
    const styleType = getLineStyle(datum.lineDash, style.type ?? datum.lineStyle);
    const computedLineDash = getComputedLineDash(strokeWidth, styleType);

    datum.strokeWidth = strokeWidth;
    datum.computedLineDash = computedLineDash;
    datum.lineStyle = styleType;
    datum.lineCap = styleType === 'dotted' ? 'round' : undefined;
}

export function getLineStyle(lineDash?: PixelSize[], lineStyle?: AnnotationLineStyleType) {
    return lineDash ? 'dashed' : lineStyle ?? 'solid';
}

export function getComputedLineDash(strokeWidth: number, styleType: AnnotationLineStyleType): PixelSize[] {
    switch (styleType) {
        case 'solid':
            return [];
        case 'dashed':
            return [strokeWidth * 4, strokeWidth * 2];
        case 'dotted':
            return [0, strokeWidth * 2];
    }
}

export function setColor(
    datum: AnnotationProperties,
    colorPickerType: AnnotationOptionsColorPickerType,
    colorOpacity: string,
    color: string,
    opacity: number
) {
    switch (colorPickerType) {
        case `fill-color`: {
            if ('fill' in datum) datum.fill = color;
            if ('fillOpacity' in datum) datum.fillOpacity = opacity;
            if ('background' in datum) {
                datum.background.fill = color;
                datum.background.fillOpacity = opacity;
            }
            break;
        }
        case `line-color`: {
            if ('stroke' in datum && !NoteProperties.is(datum)) datum.stroke = color;
            if ('strokeOpacity' in datum && !NoteProperties.is(datum)) datum.strokeOpacity = opacity;
            if ('axisLabel' in datum) {
                datum.axisLabel.fill = color;
                datum.axisLabel.fillOpacity = opacity;
                datum.axisLabel.stroke = color;
                datum.axisLabel.strokeOpacity = opacity;
            }
            if (NoteProperties.is(datum)) {
                datum.fill = color;
                datum.fillOpacity = opacity;
            }
            break;
        }
        case `text-color`: {
            if ('color' in datum) datum.color = colorOpacity;
            break;
        }
    }
}
