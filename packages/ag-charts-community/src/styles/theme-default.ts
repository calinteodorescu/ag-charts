export default `
.ag-charts-theme-default,
.ag-charts-theme-default-dark {
    /* Colors */
    --ag-charts-active-color: var(--ag-active-color, #2196f3);
    --ag-charts-background-color: var(--ag-background-color, #fff);
    --ag-charts-foreground-color: var(--ag-foreground-color, #181d1f);
    --ag-charts-border-color: var(--ag-border-color, #dddddd);
    --ag-charts-hover-color: var(
        --ag-row-hover-color,
        color-mix(in srgb, transparent, var(--ag-charts-active-color) 12%)
    );

    --ag-charts-secondary-foreground-color: var(--ag-charts-foreground-color);

    --ag-charts-header-foreground-color: var(--ag-header-foreground-color, var(--ag-charts-secondary-foreground-color));
    --ag-charts-header-background-color: var(
        --ag-header-background-color,
        color-mix(in srgb, var(--ag-charts-background-color), var(--ag-charts-foreground-color) 2%)
    );

    /* Sizing */
    --ag-charts-font-size: var(--ag-font-size, 14px);
    --ag-charts-size: var(--ag-grid-size, 8px);
    --ag-charts-horizontal-padding: var(--ag-cell-horizontal-padding, calc(var(--ag-charts-size) * 2));
    --ag-charts-header-height: var(--ag-header-height, 48px);

    /* Borders */
    --ag-charts-borders: var(--ag-borders, solid 1px);
    --ag-charts-borders-critical: var(--ag-borders-critical, solid 1px);
    --ag-charts-border-radius: var(--ag-border-radius, 4px);
    --ag-charts-wrapper-border-radius: var(--ag-wrapper-border-radius, 8px);

    /* Shadow */
    --ag-charts-card-shadow: var(--ag-card-shadow, 0 1px 4px 1px rgba(186, 191, 199, 0.4));
    --ag-charts-popup-shadow: var(--ag-popup-shadow, 0 0 16px 0 rgba(0, 0, 0, 0.15));
}

`;
