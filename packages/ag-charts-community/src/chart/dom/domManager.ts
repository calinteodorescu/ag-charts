import { BBox } from '../../scene/bbox';
import { createElement, getDocument } from '../../util/dom';
import { GuardedElement } from '../../util/guardedElement';
import { type Size, SizeMonitor } from '../../util/sizeMonitor';
import { BaseManager } from '../baseManager';

const domElementClasses = ['styles', 'canvas', 'canvas-overlay'] as const;
export type DOMElementClass = (typeof domElementClasses)[number];

const domElementConfig: Record<
    DOMElementClass,
    { childElementType: 'style' | 'canvas' | 'div'; style?: Partial<CSSStyleDeclaration> }
> = {
    styles: { childElementType: 'style' },
    canvas: { childElementType: 'canvas' },
    'canvas-overlay': { childElementType: 'div' },
};

const STYLES = `
.ag-charts-wrapper {
    position: relative;
    touch-action: none;
    box-sizing: border-box;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
}

.ag-charts-canvas {
    position: absolute;
}

.ag-charts-canvas > * {
    display: block;
}

.ag-charts-canvas-overlay {
    position: relative;
    display: contents;
}

.ag-charts-canvas-overlay > * {
    position: absolute;
}
`;

const BASE_DOM = `
<div class="ag-charts-wrapper ag-charts-styles" data-ag-charts>
    <div class="ag-charts-canvas">
        <div class="ag-charts-canvas-overlay"></div>
    </div>
</div>
`;

function setupObserver(element: HTMLElement, cb: (intersectionRatio: number) => void) {
    // Detect when the chart becomes invisible and hide the tooltip as well.
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (entry.target === element) {
                    cb(entry.intersectionRatio);
                }
            }
        },
        { root: element }
    );
    observer.observe(element);
    return observer;
}

export class GuardedAgChartsWrapperElement extends GuardedElement {
    constructor() {
        const templateEl = createElement('div');
        templateEl.innerHTML = BASE_DOM;

        super(
            templateEl.children.item(0) as HTMLElement,
            getDocument().createElement('div'),
            getDocument().createElement('div')
        );
    }

    override destroy(): void {
        super.destroy();

        this.topTabGuard.remove();
        this.bottomTabGuard.remove();
        this.element.remove();
    }
}

type Events = { type: 'hidden' } | { type: 'resize'; size: Size };

export class DOMManager extends BaseManager<Events['type'], Events> {
    private readonly rootElements: Map<DOMElementClass, { element: HTMLElement; children: Map<string, HTMLElement> }>;
    private readonly parentElement: GuardedElement;
    private container?: HTMLElement;

    private readonly observer?: IntersectionObserver;
    private readonly sizeMonitor: SizeMonitor;

    constructor(container?: HTMLElement) {
        super();

        this.parentElement = new GuardedAgChartsWrapperElement();
        const { element } = this.parentElement;
        if (container) {
            this.setContainer(container);
        }

        this.rootElements = new Map(
            domElementClasses.map((c) => {
                const cssClass = `ag-charts-${c}`;
                const el = element.classList.contains(cssClass)
                    ? element
                    : (element.querySelector(`.${cssClass}`) as HTMLElement);

                if (!el) throw new Error(`AG Charts - unable to find DOM element ${cssClass}`);

                return [c, { element: el, children: new Map<string, HTMLElement>() }];
            })
        );

        let hidden = false;
        this.observer = setupObserver(element, (intersectionRatio) => {
            if (intersectionRatio === 0 && !hidden) {
                this.listeners.dispatch('hidden', { type: 'hidden' });
            }
            hidden = intersectionRatio === 0;
        });

        this.sizeMonitor = new SizeMonitor();
        this.sizeMonitor.observe(element, (size) => this.listeners.dispatch('resize', { type: 'resize', size }));

        this.addStyles('dom-manager', STYLES);
    }

    override destroy() {
        super.destroy();

        const { element } = this.parentElement;
        this.observer?.unobserve(element);
        this.sizeMonitor.unobserve(element);

        this.rootElements.forEach((el) => {
            el.children.forEach((c) => c.remove());
            el.element.remove();
        });

        this.parentElement.destroy();
    }

    get parent() {
        return this.parentElement;
    }

    setAutoSizeStyle(_autoSize: boolean, width?: number, height?: number) {
        const { style } = this.parentElement.element;
        if (width != null && height != null) {
            style.width = `${width}px`;
            style.height = `${height}px`;
        } else {
            style.width = '100%';
            style.height = '100%';
        }
    }

    setContainer(newContainer: HTMLElement) {
        if (newContainer === this.container) return;

        this.container?.removeChild(this.parentElement.topTabGuard);
        this.container?.removeChild(this.parentElement.element);
        this.container?.removeChild(this.parentElement.bottomTabGuard);
        newContainer.appendChild(this.parentElement.topTabGuard);
        newContainer.appendChild(this.parentElement.element);
        newContainer.appendChild(this.parentElement.bottomTabGuard);

        this.container = newContainer;
    }

    setThemeClass(themeClassName: string) {
        const themeClassNamePrefix = 'ag-charts-theme-';

        const { element } = this.parentElement;
        element.classList.forEach((className) => {
            if (className.startsWith(themeClassNamePrefix) && className !== themeClassName) {
                element.classList.remove(className);
            }
        });

        element.classList.add(themeClassName);
    }

    setTabIndex(tabIndex: number) {
        this.parentElement.tabIndex = tabIndex;
    }

    addEventListener<K extends keyof HTMLElementEventMap>(
        type: K,
        listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions
    ) {
        this.parentElement.element.addEventListener(type, listener, options);
    }

    removeEventListener<K extends keyof HTMLElementEventMap>(
        type: K,
        listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
        options?: boolean | EventListenerOptions
    ) {
        this.parentElement.element.removeEventListener(type, listener, options);
    }

    getBoundingClientRect() {
        return this.parent.element.getBoundingClientRect();
    }

    getChildBoundingClientRect(type: DOMElementClass) {
        const { children } = this.rootElements.get(type) ?? {};
        if (!children) return;

        const childRects: BBox[] = [];
        for (const child of children.values()) {
            childRects.push(BBox.fromDOMRect(child.getBoundingClientRect()));
        }

        return BBox.merge(childRects);
    }

    calculateCanvasPosition(el: HTMLElement) {
        let x = 0;
        let y = 0;

        const { x: cx = 0, y: cy = 0 } = this.getChildBoundingClientRect('canvas') ?? {};
        const elRect = el.getBoundingClientRect();
        x = elRect.x - cx;
        y = elRect.y - cy;

        return { x, y };
    }

    isManagedDOMElement(el: HTMLElement, container = this.parentElement.element) {
        while (el && el !== container) {
            if (el.parentElement == null) return false;
            el = el.parentElement;
        }

        return true;
    }

    isManagedChildDOMElement(el: HTMLElement, domElementClass: DOMElementClass, id: string) {
        const { children } = this.rootElements.get(domElementClass) ?? {};

        const search = children?.get(id);
        return search != null && this.isManagedDOMElement(el, search);
    }

    isEventOverElement(event: Event | MouseEvent | TouchEvent) {
        return (
            event.target === this.parentElement.element ||
            (event.target as any)?.parentElement === this.parentElement.element ||
            (event.target as any)?.parentElement?.parentElement === this.parentElement.element
        );
    }

    addStyles(id: string, styles: string) {
        const styleElement = this.addChild('styles', id);
        styleElement.innerHTML = styles;
    }

    removeStyles(id: string) {
        this.removeChild('styles', id);
    }

    updateCursor(style: string) {
        this.parentElement.element.style.cursor = style;
    }

    getCursor() {
        return this.parentElement.element.style.cursor;
    }

    addChild(domElementClass: DOMElementClass, id: string, child?: HTMLElement) {
        const { element, children } = this.rootElements.get(domElementClass) ?? {};
        if (!children) {
            throw new Error('AG Charts - unable to create DOM elements after destroy()');
        }

        if (children.has(id)) return children.get(id)!;

        const { childElementType } = domElementConfig[domElementClass];
        if (child && child.tagName.toLowerCase() !== childElementType.toLowerCase()) {
            throw new Error('AG Charts - mismatching DOM element type');
        }

        const newChild = child ?? createElement(childElementType);
        children.set(id, newChild);
        element?.appendChild(newChild);
        return newChild;
    }

    removeChild(domElementClass: DOMElementClass, id: string) {
        const { children } = this.rootElements.get(domElementClass) ?? {};
        if (!children) return;

        if (!children.has(id)) return;

        children.get(id)?.remove();
        children.delete(id);
    }
}