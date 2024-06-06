import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { colorPickerStyles } from './colorPickerStyles';
import { colorPickerTemplate } from './colorPickerTemplate';

const { BOOLEAN, Validate, createElement } = _ModuleSupport;

const { Color } = _Util;

const moduleId = 'color-picker';

const getHsva = (input: string) => {
    try {
        const color = Color.fromString(input);
        // eslint-disable-next-line prefer-const
        let [h, s, v] = color.toHSB();
        if (Number.isNaN(h)) h = 0;
        return [h, s, v, color.a];
    } catch {
        return;
    }
};

export class ColorPicker extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @Validate(BOOLEAN)
    enabled = true;

    private readonly element: HTMLElement;

    constructor(readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        ctx.domManager.addStyles(moduleId, colorPickerStyles);

        this.element = ctx.domManager.addChild('canvas-overlay', moduleId);
    }

    show(opts: { color?: string; onChange?: (colorString: string) => void }) {
        let [h, s, v, a] = getHsva(opts.color ?? '#f00') ?? [0, 1, 0.5, 1];

        const colorPickerContainer = createElement('div');
        colorPickerContainer.innerHTML = colorPickerTemplate;
        this.element.replaceChildren(colorPickerContainer);

        const colorPicker = colorPickerContainer.firstElementChild! as HTMLDivElement;
        const hueInput = colorPicker.querySelector<HTMLInputElement>('.ag-charts-color-picker__hue-input')!;

        const alphaInput = colorPicker.querySelector<HTMLInputElement>('.ag-charts-color-picker__alpha-input')!;
        const colorInput = colorPicker.querySelector<HTMLInputElement>('.ag-charts-color-picker__color-input')!;

        const update = () => {
            const color = Color.fromHSB(h, s, v, a);
            const colorString = color.toHexString();

            colorPicker.style.setProperty('--h', `${h}`);
            colorPicker.style.setProperty('--s', `${s}`);
            colorPicker.style.setProperty('--v', `${v}`);
            colorPicker.style.setProperty('--a', `${a}`);
            colorPicker.style.setProperty('--color', colorString.slice(0, 7));
            colorPicker.style.setProperty('--color-a', colorString);

            hueInput.value = `${h}`;
            alphaInput.value = `${a}`;
            if (document.activeElement !== colorInput) {
                colorInput.value = colorString.slice(0, 7).toUpperCase();
            }

            opts.onChange?.(colorString);
        };

        update();

        const beginPaletteInteraction = (e: MouseEvent) => {
            e.preventDefault();
            colorInput.blur();
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();

            const mouseMove = ({ pageX, pageY }: MouseEvent) => {
                s = Math.min(Math.max((pageX - rect.left) / rect.width, 0), 1);
                v = 1 - Math.min(Math.max((pageY - rect.top) / rect.height, 0), 1);
                update();
            };

            mouseMove(e);

            window.addEventListener('mousemove', mouseMove);
            window.addEventListener('mouseup', () => window.removeEventListener('mousemove', mouseMove), {
                once: true,
            });
        };

        colorPicker
            .querySelector<HTMLDivElement>('.ag-charts-color-picker__palette')!
            .addEventListener('mousedown', beginPaletteInteraction);
        hueInput.addEventListener('input', (e) => {
            h = (e.currentTarget as HTMLInputElement).valueAsNumber ?? 0;
            update();
        });
        alphaInput.addEventListener('input', (e) => {
            a = (e.currentTarget as HTMLInputElement).valueAsNumber ?? 0;
            update();
        });
        colorInput.addEventListener('input', (e) => {
            const hsva = getHsva((e.currentTarget as HTMLInputElement).value);
            if (hsva == null) return;
            [h, s, v, a] = hsva;
            update();
        });
        colorInput.addEventListener('blur', () => update());
        colorInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                (e.currentTarget as HTMLInputElement).blur();
                update();
            }
        });
    }

    hide() {
        this.element.replaceChildren();
    }
}