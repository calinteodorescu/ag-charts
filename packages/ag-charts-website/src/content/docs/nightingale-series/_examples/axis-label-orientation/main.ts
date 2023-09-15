import { AgEnterpriseCharts, AgChartOptions } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: `Night & Gale Inc revenue`,
    },
    subtitle: {
        text: 'in million U.S. dollars',
    },
    series: [
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'air',
            radiusName: 'Sales',
        },
    ],
    axes: [
        {
            type: 'angle-category',
            label: {
                orientation: 'perpendicular',
            },
        },
        {
            type: 'radius-number',
        },
    ],
};

AgEnterpriseCharts.create(options);
