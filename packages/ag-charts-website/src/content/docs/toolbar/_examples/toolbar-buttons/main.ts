import { AG_CHARTS_LOCALE_EN_US, AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

function dateFormat(dateString: string, format: string) {
    const dateObject = new Date(dateString);
    const formattedDate =
        format == 'd-m'
            ? dateObject.toLocaleString('en-GB', { day: 'numeric', month: 'short' })
            : dateObject.toLocaleString('en-GB', { month: 'short', year: '2-digit' });

    return formattedDate;
}

const MONTH = 30 * 24 * 60 * 60 * 1000;

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'AAPL Stock Price' },
    zoom: {
        enabled: true,
        rangeX: {
            start: new Date(2023, 10, 26),
        },
    },
    toolbar: {
        ranges: {
            enabled: true,
            buttons: [
                {
                    label: '6 Months',
                    value: 6 * MONTH,
                },
                {
                    label: '12 Months',
                    value: 12 * MONTH,
                },
                {
                    label: 'All Data',
                    value: (start, end) => [start, end],
                },
            ],
        },
    },
    tooltip: {
        enabled: true,
    },
    axes: [
        {
            type: 'number',
            position: 'left',
            label: {},
        },
        {
            type: 'category',
            position: 'bottom',
            label: {
                autoRotate: false,
                formatter: ({ value }) => dateFormat(value, 'd-m'),
            },
            crosshair: {
                enabled: true,
                label: {
                    renderer: ({ value }) => {
                        return { text: dateFormat(value, 'd-m') };
                    },
                },
            },
        },
    ],
    data: getData(),
    series: [
        {
            type: 'candlestick',
            xKey: 'date',
            openKey: 'open',
            closeKey: 'close',
            highKey: 'high',
            lowKey: 'low',
        },
    ],
    navigator: {
        miniChart: {
            padding: { top: 5, bottom: 5 },
            series: [
                {
                    type: 'line',
                    xKey: 'date',
                    yKey: 'open',
                    marker: { enabled: false },
                },
            ],
            label: {
                formatter: ({ value }) => dateFormat(value, 'm-y'),
            },
        },
    },
};

AgCharts.create(options);
