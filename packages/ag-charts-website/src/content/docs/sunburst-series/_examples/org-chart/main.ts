import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

import { data } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            type: 'sunburst',
            labelKey: 'orgHierarchy',
            colorRange: ['#cb4b3f', '#6acb64'],
            highlightStyle: {
                strokeWidth: 3,
            },
        },
    ],
    title: {
        text: 'Organizational Chart',
    },
    subtitle: {
        text: 'of a top secret startup',
    },
};

AgEnterpriseCharts.create(options);
