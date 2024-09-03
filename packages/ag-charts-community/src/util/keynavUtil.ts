function addRemovableEventListener<K extends keyof WindowEventMap>(
    destroyFns: (() => void)[],
    elem: Window,
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => any
): () => void;

function addRemovableEventListener<K extends keyof HTMLElementEventMap>(
    destroyFns: (() => void)[],
    elem: HTMLElement,
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any
): () => void;

function addRemovableEventListener<K extends keyof (HTMLElementEventMap | WindowEventMap)>(
    destroyFns: (() => void)[],
    elem: HTMLElement | Window,
    type: K,
    listener: (this: unknown, ev: unknown) => unknown
): () => void {
    elem.addEventListener(type, listener);
    const remover = () => elem.removeEventListener(type, listener);
    destroyFns.push(remover);
    return remover;
}

function addEscapeEventListener(
    destroyFns: (() => void)[],
    elem: HTMLElement,
    onEscape: (event: KeyboardEvent) => void
) {
    addRemovableEventListener(destroyFns, elem, 'keydown', (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onEscape(event);
        }
    });
}

function addMouseCloseListener(destroyFns: (() => void)[], menu: HTMLElement, hideCallback: () => void): () => void {
    const self = addRemovableEventListener(destroyFns, window, 'mousedown', (event: MouseEvent) => {
        if ([0, 2].includes(event.button) && !containsPoint(menu, event)) {
            hideCallback();
            self();
        }
    });
    return self;
}

function containsPoint(container: Element, event: MouseEvent) {
    if (event.target instanceof Element) {
        const { x, y, width, height } = container.getBoundingClientRect();
        const { clientX: ex, clientY: ey } = event;
        return ex >= x && ey >= y && ex <= x + width && ey <= y + height;
    }
    return false;
}

function matchesKey(event: KeyboardEvent, key: string, ...morekeys: string[]): boolean {
    return (
        !(event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) &&
        (event.key === key || morekeys.some((altkey) => event.key === altkey))
    );
}

function linkTwoButtons(destroyFns: (() => void)[], src: HTMLElement, dst: HTMLElement | undefined, key: string) {
    if (!dst) return;

    addRemovableEventListener(destroyFns, src, 'keydown', (event: KeyboardEvent) => {
        if (matchesKey(event, key)) {
            dst.focus();
        }
    });
}

function linkThreeButtons(
    destroyFns: (() => void)[],
    curr: HTMLElement,
    next: HTMLElement | undefined,
    nextKey: string,
    prev: HTMLElement | undefined,
    prevKey: string
) {
    linkTwoButtons(destroyFns, curr, prev, prevKey);
    linkTwoButtons(destroyFns, curr, next, nextKey);
    addRemovableEventListener(destroyFns, curr, 'keydown', (event: KeyboardEvent) => {
        if (matchesKey(event, nextKey, prevKey)) {
            event.preventDefault();
        }
    });
}

const PREV_NEXT_KEYS = {
    horizontal: { nextKey: 'ArrowRight', prevKey: 'ArrowLeft' },
    vertical: { nextKey: 'ArrowDown', prevKey: 'ArrowUp' },
} as const;

// https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/toolbar_role
export function initToolbarKeyNav(
    opts: { toolbar: HTMLElement } & Parameters<typeof initRovingTabIndex>[0]
): ReturnType<typeof initRovingTabIndex> {
    opts.toolbar.role = 'toolbar';
    opts.toolbar.ariaOrientation = opts.orientation;
    opts.toolbar.ariaHidden = (opts.buttons.length === 0).toString();
    return initRovingTabIndex(opts);
}

// https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_roving_tabindex
export function initRovingTabIndex(opts: {
    orientation: 'horizontal' | 'vertical';
    buttons: HTMLElement[];
    wrapAround?: boolean;
    onFocus?: (event: FocusEvent) => void;
    onBlur?: (event: FocusEvent) => void;
    onEscape?: (event: KeyboardEvent) => void;
}) {
    const { orientation, buttons, wrapAround = false, onEscape, onFocus, onBlur } = opts;
    const { nextKey, prevKey } = PREV_NEXT_KEYS[orientation];

    // Assistive Technologies might provide functionality to focus on any element at random.
    // For example, in VoiceOver the user can press Ctrl+Opt+Shift Up to leave the toolbar, and then
    // focus on the first item by pressing Ctrl+Opt+Shift Down to enter the toolbar again.
    // Therefore, we must use brute-force to ensure that there's only one tabIndex=0 in the toolbar.
    const setTabIndices = (event: FocusEvent) => {
        if (event.target && 'tabIndex' in event.target) {
            buttons.forEach((b) => (b.tabIndex = -1));
            event.target.tabIndex = 0;
        }
    };

    // When wrapAround is false, use c,m such that (c+x)%m === x
    const [c, m] = wrapAround ? [buttons.length, buttons.length] : [0, Infinity];
    const destroyFns: (() => void)[] = [];
    for (let i = 0; i < buttons.length; i++) {
        const prev = buttons[(c + i - 1) % m];
        const curr = buttons[i];
        const next = buttons[(c + i + 1) % m];
        addRemovableEventListener(destroyFns, curr, 'focus', setTabIndices);
        if (onFocus) addRemovableEventListener(destroyFns, curr, 'focus', onFocus);
        if (onBlur) addRemovableEventListener(destroyFns, curr, 'blur', onBlur);
        if (onEscape) addEscapeEventListener(destroyFns, curr, onEscape);
        linkThreeButtons(destroyFns, curr, prev, prevKey, next, nextKey);
        curr.tabIndex = i === 0 ? 0 : -1;
    }

    return destroyFns;
}

export interface MenuCloser {
    close(): void;
    finishClosing(): void;
}

export type MenuDevice =
    | { type: 'keyboard'; lastFocus: HTMLElement }
    | { type: 'mouse'; lastFocus: HTMLElement | undefined };

class MenuCloserImp implements MenuCloser {
    public readonly destroyFns: (() => void)[] = [];

    constructor(
        menu: HTMLElement,
        private lastFocus: HTMLElement | undefined,
        public readonly closeCallback: () => void
    ) {
        this.destroyFns.push(addMouseCloseListener(this.destroyFns, menu, () => this.close()));
    }

    close() {
        this.closeCallback();
        this.finishClosing();
    }

    finishClosing() {
        this.destroyFns.forEach((d) => d());
        this.destroyFns.length = 0;
        this.lastFocus?.focus();
        this.lastFocus = undefined;
    }
}

// https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/menu_role
export function initMenuKeyNav(opts: {
    orientation: 'vertical';
    device: MenuDevice;
    menu: HTMLElement;
    buttons: HTMLElement[];
    closeCallback: () => void;
}): MenuCloser {
    const { device, orientation, menu, buttons, closeCallback } = opts;
    const { nextKey, prevKey } = PREV_NEXT_KEYS[orientation];

    const menuCloser = new MenuCloserImp(menu, device.lastFocus, closeCallback);
    const onEscape = () => menuCloser.close();
    const { destroyFns } = menuCloser;

    menu.role = 'menu';
    menu.ariaOrientation = orientation;
    initRovingTabIndex({ orientation, buttons, onEscape, wrapAround: true });

    // Add handlers for the menu element itself.
    menu.tabIndex = -1;
    addEscapeEventListener(destroyFns, menu, onEscape);
    addRemovableEventListener(destroyFns, menu, 'keydown', (ev: KeyboardEvent) => {
        if (ev.target === menu && (ev.key === nextKey || ev.key === prevKey)) {
            ev.preventDefault();
            buttons[0]?.focus();
        }
    });

    if (device.type === 'keyboard') {
        buttons[0]?.focus();
    } else {
        menu.focus();
    }

    return menuCloser;
}

export function makeAccessibleClickListener(element: HTMLElement, onclick: (event: MouseEvent) => unknown) {
    return (event: MouseEvent) => {
        if (element.ariaDisabled === 'true') {
            return event.preventDefault();
        }
        onclick(event);
    };
}

export function isButtonClickEvent(event: KeyboardEvent | MouseEvent): boolean {
    if ('button' in event) {
        return event.button === 0;
    }
    return (
        !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && ['Enter', 'Space'].includes(event.code)
    );
}
