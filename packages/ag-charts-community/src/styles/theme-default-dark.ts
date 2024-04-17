export default `
.ag-charts-theme-default-dark {
    /* Colors */
    --ag-charts-background-color: var(--ag-background-color, color-mix(in srgb, #fff, #182230 97%));
    --ag-charts-foreground-color: var(--ag-foreground-color, #fff);
    --ag-charts-border-color: var(--ag-border-color, rgba(255, 255, 255, 0.16));
    --ag-charts-hover-color: var(
        --ag-row-hover-color,
        color-mix(in srgb, transparent, var(--ag-charts-active-color) 20%)
    );

    --ag-charts-header-background-color: var(--ag-header-background-color, color-mix(in srgb, #fff, #182230 93%));

    /* Shadow */
    --ag-charts-card-shadow: var(--ag-card-shadow, 0 1px 20px 1px black);
    --ag-charts-popup-shadow: var(--ag-popup-shadow, 0 1px 6px rgba(0, 0, 0, 0.5));
}

`;