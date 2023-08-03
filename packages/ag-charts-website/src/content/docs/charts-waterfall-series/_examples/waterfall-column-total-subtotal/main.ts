import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Waterfall Column',
    },
    series: [
        {
            type: 'waterfall-column',
            xKey: 'date',
            xName: 'Date',
            yKey: 'amount',
            yName: 'Amount',
            totals: [
                { totalType: 'subtotal', index: 4, axisLabel: 'Subtotal 1' },
                { totalType: 'subtotal', index: 9, axisLabel: 'Subtotal 2' },
                { totalType: 'total', index: 10, axisLabel: 'Total' },
            ],
        },
    ],
};

AgEnterpriseCharts.create(options);
