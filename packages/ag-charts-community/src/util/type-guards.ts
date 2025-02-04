import type { PlainObject } from './types';

export function isDefined<T>(val: T | undefined | null): val is T {
    return val != null;
}

export function isArray<T>(value: T | T[]): value is T[] {
    return Array.isArray(value);
}

export function isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
}

export function isDate(value: unknown): value is Date {
    return value instanceof Date;
}

export function isValidDate(value: unknown): value is Date {
    return isDate(value) && !isNaN(Number(value));
}

export function isRegExp(value: unknown): value is RegExp {
    return value instanceof RegExp;
}

export function isFunction(value: unknown): value is Function {
    return typeof value === 'function';
}

export function isObject(value: unknown): value is PlainObject {
    return typeof value === 'object' && value !== null && !isArray(value);
}

export function isObjectLike(value: unknown): value is PlainObject | unknown[] {
    return isArray(value) || isPlainObject(value);
}

export function isPlainObject(value: unknown): value is PlainObject {
    return typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype;
}

export function isString(value: unknown): value is string {
    return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
    return typeof value === 'number';
}

export function isFiniteNumber(value: unknown): value is number {
    return Number.isFinite(value);
}

export function isHtmlElement(value: unknown): value is HTMLElement {
    return typeof window !== 'undefined' && value instanceof HTMLElement;
}

export function isEnumKey<T extends object>(enumObject: T, enumKey: keyof T): enumKey is keyof T {
    return isString(enumKey) && Object.keys(enumObject).includes(enumKey);
}

export function isEnumValue<T extends object>(enumObject: T, enumValue: unknown): enumValue is T[keyof T] {
    return Object.values(enumObject).includes(enumValue);
}

export function isSymbol(value: unknown): value is symbol {
    return typeof value === 'symbol';
}

export function excludesType<T extends string, O extends { type: T }, X extends T>(
    obj: O & { type: T },
    excluded: X
): obj is O & { type: Exclude<T, X> } {
    return obj.type !== excluded;
}
