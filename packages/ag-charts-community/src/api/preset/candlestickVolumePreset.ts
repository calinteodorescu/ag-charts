import type {
    AgAxisLabelFormatterParams,
    AgBarSeriesFormatterParams,
    AgCartesianChartOptions,
    AgCartesianSeriesTooltipRendererParams,
    AgCrosshairLabelRendererParams,
    AgSeriesTooltip,
    CandlestickVolumePreset,
} from '../../options/agChartOptions';

function dateFormat(dateString: string, format: string) {
    const dateObject = new Date(dateString);
    return format == 'd-m'
        ? dateObject.toLocaleString('en-GB', { day: 'numeric', month: 'short' })
        : dateObject.toLocaleString('en-GB', { month: 'short', year: '2-digit' });
}

const tooltipOptions: AgSeriesTooltip<any> = {
    position: {
        type: 'top-left',
        xOffset: 70,
        yOffset: 20,
    },
    renderer: ({ datum }: AgCartesianSeriesTooltipRendererParams) => {
        const fill = datum.open < datum.close ? '#089981' : '#F23645';
        return `
           <div>
           O<span style="color: ${fill}">${datum.open}</span>
           H<span style="color: ${fill}">${datum.high}</span>
           L<span style="color: ${fill}">${datum.low}</span>
           C<span style="color: ${fill}">${datum.close}</span>
           Vol <span style="color: ${fill}">${Intl.NumberFormat('en', {
               notation: 'compact',
               maximumSignificantDigits: 3,
           }).format(datum.volume)}</span></div>`;
    },
};

export function candlestickVolumePreset(opts: CandlestickVolumePreset): AgCartesianChartOptions {
    const {
        xKey = 'date',
        highKey = 'high',
        openKey = 'open',
        lowKey = 'low',
        closeKey = 'close',
        volumeKey = 'volume',
    } = opts;
    return {
        zoom: {
            enabled: true,
        },
        toolbar: {
            ranges: {
                enabled: true,
            },
        },
        legend: { enabled: false },
        series: [
            {
                type: 'bar',
                xKey: 'date',
                yKey: volumeKey,
                itemStyler: (params: AgBarSeriesFormatterParams<any>) => {
                    const { datum } = params;
                    const fill = datum[openKey] < datum[closeKey] ? '#92D2CC' : '#F7A9A7';
                    return { fill };
                },
                tooltip: tooltipOptions,
            },
            {
                type: 'candlestick',
                xKey,
                openKey,
                closeKey,
                highKey,
                lowKey,
                item: {
                    up: {
                        fill: '#089981',
                        stroke: '#089981',
                    },
                    down: {
                        fill: '#F23645',
                        stroke: '#F23645',
                    },
                },
                tooltip: tooltipOptions,
            },
        ],
        axes: [
            {
                type: 'number',
                position: 'right',
                keys: ['open', 'close', 'high', 'low'],
                max: 210,
                tick: {
                    size: 0,
                    maxSpacing: 50,
                },
                label: {
                    padding: 0,
                    fontSize: 10,
                    format: '.2f',
                },
                thickness: 25,
                crosshair: {
                    enabled: true,
                    snap: false,
                },
            },
            {
                type: 'number',
                position: 'left',
                keys: ['volume'],
                max: 1000000000,
                label: { enabled: false },
                crosshair: { enabled: false },
            },
            {
                type: 'category',
                position: 'bottom',
                label: {
                    enabled: true,
                    autoRotate: false,
                    formatter: ({ value }: AgAxisLabelFormatterParams) => dateFormat(value, 'd-m'),
                },
                crosshair: {
                    enabled: true,
                    label: {
                        renderer: ({ value }: AgCrosshairLabelRendererParams) => {
                            return { text: dateFormat(value, 'd-m') };
                        },
                    },
                },
            },
        ],
        annotations: {
            enabled: true,
        },
    };
}
