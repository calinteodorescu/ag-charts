import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

let connectMissingData = false;

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'People Born',
    },
    subtitle: {
        text: '2008-2020',
    },
    series: [
        {
            xKey: 'year',
            yKey: 'visitors',
            connectMissingData,
        },
    ],
};

const chart = AgCharts.create(options);

function toggleConnectMissingData() {
    connectMissingData = !connectMissingData;
    AgCharts.updateDelta(chart, {
        series: options.series.map((series) => ({
            ...series,
            connectMissingData,
        })),
    });
}
