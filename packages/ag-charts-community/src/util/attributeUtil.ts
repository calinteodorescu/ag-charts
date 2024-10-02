import type { Nullable } from './types';

type ElementID = string;

type BaseAttributeTypeMap = {
    role: 'figure' | 'img' | 'radio' | 'radiogroup' | 'status' | 'switch' | 'tab' | 'tablist' | 'tabpanel';
    'aria-checked': boolean;
    'aria-controls': ElementID;
    'aria-expanded': boolean;
    'aria-haspopup': boolean;
    'aria-hidden': boolean;
    'aria-label': string | undefined;
    'aria-labelledby': ElementID;
    'aria-live': 'assertive' | 'polite';
    'aria-selected': boolean;
    class: string;
    id: ElementID;
    tabindex: 0 | -1;
    title: string;
};

type InputAttributeTypeMap = BaseAttributeTypeMap & {
    placeholder: string;
};

export type AttributeSet = Partial<{ [K in keyof BaseAttributeTypeMap]: BaseAttributeTypeMap[K] }>;
export type InputAttributeSet = Partial<{ [K in keyof InputAttributeTypeMap]: InputAttributeTypeMap[K] }>;

type AttributeArray = (keyof BaseAttributeTypeMap)[];

function internalSetAttribute(e: Nullable<HTMLElement>, qualifiedName: string, value: Nullable<string>) {
    if (e != null) {
        if (value == null || value === '') {
            e.removeAttribute(qualifiedName);
        } else {
            e.setAttribute(qualifiedName, value.toString());
        }
    }
}

export function setAttribute<A extends keyof BaseAttributeTypeMap>(
    e: Nullable<HTMLElement>,
    qualifiedName: A,
    value: BaseAttributeTypeMap[A]
): void;

export function setAttribute<A extends keyof InputAttributeTypeMap>(
    e: Nullable<HTMLTextAreaElement>,
    qualifiedName: A,
    value: InputAttributeTypeMap[A]
): void;

export function setAttribute<A extends keyof BaseAttributeTypeMap>(
    e: Nullable<HTMLElement>,
    qualifiedName: A,
    value: BaseAttributeTypeMap[A]
) {
    internalSetAttribute(e, qualifiedName, value?.toString());
}

export function setAttributes(e: Nullable<HTMLElement>, attrs: AttributeSet | undefined): void;
export function setAttributes(e: Nullable<HTMLTextAreaElement>, attrs: InputAttributeTypeMap | undefined): void;
export function setAttributes(e: Nullable<HTMLElement>, attrs: AttributeSet | undefined) {
    if (attrs == null) return;

    let key: keyof typeof attrs;
    for (key in attrs) {
        if (key === 'class') continue;
        setAttribute(e as HTMLElement, key, attrs[key]);
    }
}

export function copyAttributes(keys: AttributeArray, dst: Nullable<HTMLElement>, src: Nullable<HTMLElement>): void {
    if (dst == null || src == null) return;

    for (const k of keys) {
        internalSetAttribute(dst, k, src.getAttribute(k));
    }
}
