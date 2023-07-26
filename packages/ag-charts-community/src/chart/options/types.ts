export type FontStyle = 'normal' | 'italic' | 'oblique';
export type FontWeight =
    | 'normal'
    | 'bold'
    | 'bolder'
    | 'lighter'
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900';
export type FontFamily = string;
export type FontSize = number;

export type MarkerShape = 'circle' | 'cross' | 'diamond' | 'heart' | 'plus' | 'triangle' | any;

/** Alias to denote that a value should be a CSS-compliant color string, such as `#FFFFFF` or `rgb(255, 255, 255)` or `white`. */
export type CssColor = string;

/** Alias to denote that a value reflects an alpha opacity in the range [0, 1]. */
export type Opacity = number;

/** Alias to denote that a value is a measurement in pixels. */
export type PixelSize = number;

/** Alias to denote that a value is a ratio, usually in the range [0, 1]. */
export type Ratio = number;

/** Alias to denote that a value is a data value. */
export type DataValue = any;

export type TextWrap = 'never' | 'always' | 'hyphenate' | 'on-space';

/** Define a range within which an interaction can trigger on a point with one of:
 * - A distance in pixels from a point within which the event can be triggered.
 * - `'exact'` triggers when the event occurs directly over a point.
 * - `'nearest'` always tracks the nearest point anywhere on the chart.
 */
export type InteractionRange = PixelSize | 'exact' | 'nearest';
