const html = String.raw;

export const colorPickerTemplate = html`
    <div class="ag-charts-color-picker">
        <div class="ag-charts-color-picker__palette"></div>
        <input class="ag-charts-color-picker__hue-input" type="range" min="0" max="360" value="0" />
        <input class="ag-charts-color-picker__alpha-input" type="range" min="0" max="1" value="1" step="0.01" />
        <label class="ag-charts-color-picker__color-field">
            <span class="ag-charts-color-picker__color-label">Color</span>
            <input class="ag-charts-color-picker__color-input" value="#000" />
        </label>
    </div>
`;