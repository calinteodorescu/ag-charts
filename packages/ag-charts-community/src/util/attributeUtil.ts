import type { Nullable } from './types';

type ElementID = string;

type BaseAttributeTypeMap = {
    role: 'figure' | 'img' | 'radio' | 'radiogroup' | 'status' | 'switch' | 'tab' | 'tablist' | 'tabpanel';
    'aria-checked': boolean;
    'aria-controls': ElementID;
    'aria-expanded': boolean;
    'aria-haspopup': boolean;
    'aria-hidden': boolean;
    'aria-label': string;
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

export function setAttribute<A extends keyof BaseAttributeTypeMap>(
    e: Nullable<HTMLElement>,
    qualifiedName: A,
    value: BaseAttributeTypeMap[A] | undefined
): void;

export function setAttribute<A extends keyof InputAttributeTypeMap>(
    e: Nullable<HTMLTextAreaElement>,
    qualifiedName: A,
    value: InputAttributeTypeMap[A] | undefined
): void;

export function setAttribute<A extends keyof BaseAttributeTypeMap>(
    e: Nullable<HTMLElement>,
    qualifiedName: A,
    value: BaseAttributeTypeMap[A] | undefined
) {
    if (value === undefined || value === '') {
        e?.removeAttribute(qualifiedName);
    } else {
        e?.setAttribute(qualifiedName, value.toString());
    }
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
