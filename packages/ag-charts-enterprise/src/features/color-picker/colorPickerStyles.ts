const css = String.raw;

export const colorPickerStyles = css`
    .ag-charts-color-picker {
        position: absolute;
        display: flex;
        flex-direction: column;
        width: 190px;
        padding: 8px;
        border: 1px solid #d0d1d1;
        background: #f8f8f8;
        border-radius: 4px;

        --h: 0;
        --s: 0;
        --v: 0;
        --a: 0;
        --color: #000;
        --color-a: #000;

        --thumb-size: 18px;
        --inner-width: 172px;
        --track-height: 12px;
        --palette-height: 136px;
    }

    .ag-charts-color-picker__palette {
        position: relative;
        width: 100%;
        height: var(--palette-height);
        margin-bottom: 8px;
        background:
            linear-gradient(to bottom, #0000, #000),
            linear-gradient(to right, #fff, #fff0) hsl(var(--h), 100%, 50%);
        border-radius: 6px;
        box-shadow: inset 0 0 0 1px #0003;
    }

    .ag-charts-color-picker__palette::after {
        content: '';
        position: absolute;
        display: block;
        top: calc(var(--thumb-size) * -0.5 + (1 - var(--v)) * 100%);
        left: calc(var(--thumb-size) * -0.5 + var(--s) * 100%);
        width: var(--thumb-size);
        height: var(--thumb-size);
        background: var(--color);
        border-radius: 99px;
        border: 3px solid white;
        filter: drop-shadow(0 0 5px #00000038);
    }

    .ag-charts-color-picker__hue-input,
    .ag-charts-color-picker__alpha-input {
        -webkit-appearance: none;
        display: block;
        position: relative;
        padding: 0;
        margin: 0 calc(var(--inset) * -1);
        border: 0;
        height: var(--thumb-size);
        width: auto;
        background: transparent;
        --inset: calc((var(--thumb-size) - var(--track-height)) / 2);
    }

    .ag-charts-color-picker__hue-input::-webkit-slider-thumb,
    .ag-charts-color-picker__alpha-input::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: var(--thumb-size);
        height: var(--thumb-size);
        background: hsl(var(--h), 100%, 50%);
        border-radius: 99px;
        border: 3px solid white;
        filter: drop-shadow(0 0 5px #00000038);
    }

    .ag-charts-color-picker__hue-input::before,
    .ag-charts-color-picker__alpha-input::before {
        position: absolute;
        content: '';
        display: block;
        top: calc(50% - var(--track-height) / 2);
        left: var(--inset);
        right: var(--inset);
        height: var(--track-height);
        border-radius: 99px;
        box-shadow: inset 0 0 0 1px #0003;
    }

    .ag-charts-color-picker__hue-input {
        margin-bottom: 4px;
    }

    .ag-charts-color-picker__hue-input::before {
        /* Conceptually we're insetting the gradient by thumb-size */
        /* However, the track has a negative margin, so the actual value is track-height */
        background: linear-gradient(
            to right,
            #f00,
            #f00 calc((100% - var(--track-height)) * 0 / 6 + var(--track-height) / 2),
            #ff0 calc((100% - var(--track-height)) * 1 / 6 + var(--track-height) / 2),
            #0f0 calc((100% - var(--track-height)) * 2 / 6 + var(--track-height) / 2),
            #0ff calc((100% - var(--track-height)) * 3 / 6 + var(--track-height) / 2),
            #00f calc((100% - var(--track-height)) * 4 / 6 + var(--track-height) / 2),
            #f0f calc((100% - var(--track-height)) * 5 / 6 + var(--track-height) / 2),
            #f00 calc((100% - var(--track-height)) * 6 / 6 + var(--track-height) / 2)
        );
    }

    .ag-charts-color-picker__alpha-input {
        margin-bottom: 7px;
        --checker: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect x="0" y="0" width="4" height="4" fill="%23fff"/><path d="M0 0H2V4H4V2H0Z" fill="%23b2b2b2"/></svg>');
    }

    .ag-charts-color-picker__alpha-input::before {
        background:
            linear-gradient(to right, hsla(var(--h), 100%, 50%, 0), hsla(var(--h), 100%, 50%, 1)),
            var(--checker) top left / 4px 4px;
    }

    .ag-charts-color-picker__alpha-input::-webkit-slider-thumb {
        /* Linear gradient is required to overlay colour */
        background: linear-gradient(to bottom, hsla(var(--h), 100%, 50%, var(--a)), hsla(var(--h), 100%, 50%, var(--a)))
            white;
    }

    .ag-charts-color-picker__color-field {
        display: flex;
        border: 1px solid var(--ag-charts-border-color);
        background: var(--ag-charts-background-color);
        border-radius: 4px;
        overflow: hidden;
    }

    .ag-charts-color-picker__color-field:focus-within {
        border-color: var(--ag-charts-active-color);
        box-shadow: var(--ag-charts-focus-border-shadow);
    }

    .ag-charts-color-picker__color-label {
        width: 16px;
        height: 16px;
        margin: 7px 0px 7px 7px;
        color: transparent;
        background: var(--color);
        border-radius: 2px;
        border: 1px solid #0003;
    }

    .ag-charts-color-picker__color-input {
        flex: 1;
        min-width: 0;
        padding: 7px 7px 7px 8px;
        border: 0;
        margin: 0;
        background: transparent;
        font-variant: tabular-nums;
    }

    .ag-charts-color-picker__color-input:focus,
    .ag-charts-color-picker__color-input:active {
        border: none;
        outline: none;
    }
`;
