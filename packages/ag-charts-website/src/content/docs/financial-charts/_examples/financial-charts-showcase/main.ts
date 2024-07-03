import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: { text: 'Acme Inc.' },
    initialState: {
        annotations: [
            {
                type: 'parallel-channel',
                start: { x: { __type: 'date', value: new Date('2023-10-23').getTime() }, y: 148.0 },
                end: { x: { __type: 'date', value: new Date('2024-04-12').getTime() }, y: 207.0 },
                height: 14,
            },
            {
                type: 'horizontal-line',
                value: 111.0,
                stroke: '#089981',
                axisLabel: {
                    fill: '#089981',
                },
            },
            {
                type: 'horizontal-line',
                value: 125.0,
                stroke: '#089981',
                axisLabel: {
                    fill: '#089981',
                },
            },
            {
                type: 'horizontal-line',
                value: 143.8,
                stroke: '#F23645',
                axisLabel: {
                    fill: '#F23645',
                },
            },
            {
                type: 'horizontal-line',
                value: 200.8,
                stroke: '#F23645',
                axisLabel: {
                    fill: '#F23645',
                },
            },
        ],
    },
};

const chart = AgCharts.createFinancialChart(options);