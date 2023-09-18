import { AgEnterpriseCharts, AgChartOptions } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Change in Number of Jobs',
        fontSize: 18,
        spacing: 25,
    },
    footnote: {
        text: 'Source: Office for National Statistics',
    },
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'job',
            yKey: 'change',
            fill: 'rgba(0, 117, 163, 0.9)',
            stroke: 'rgba(0, 117, 163, 0.9)',
            highlightStyle: {
                item: {
                    fill: '#0ab9ff',
                },
            },
            label: {
                fontWeight: 'bold',
                color: 'white',
                formatter: (params) => {
                    return (params.value > 0 ? '+' : '') + params.value;
                },
            },
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'left',
        },
        {
            type: 'number',
            position: 'bottom',
            title: {
                enabled: true,
                text: 'Change / thousands',
            },
        },
    ],
};

AgEnterpriseCharts.create(options);
