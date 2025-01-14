import { AgCharts, AgPolarChartOptions } from 'ag-charts-community';

import { getData } from './data';

const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'pie',
            angleKey: 'value',
            calloutLabelKey: 'label',
        },
    ],
    legend: {
        maxHeight: 200,
        item: {
            maxWidth: 130,
            paddingX: 32,
            paddingY: 8,
            marker: {
                padding: 8,
            },
        },
    },
};

const chart = AgCharts.create(options);

function updateLegendItemPaddingX(event: any) {
    var value = +event.target.value;

    options.legend!.item!.paddingX = value;
    chart.update(options);

    document.getElementById('xPaddingValue')!.innerHTML = String(value);
}

function updateLegendItemPaddingY(event: any) {
    var value = event.target.value;

    options.legend!.item!.paddingY = +event.target.value;
    chart.update(options);

    document.getElementById('yPaddingValue')!.innerHTML = String(value);
}

function updateLegendItemSpacing(event: any) {
    var value = +event.target.value;

    options.legend!.item!.marker!.padding = value;
    chart.update(options);

    document.getElementById('markerPaddingValue')!.innerHTML = String(value);
}

function updateLegendItemMaxWidth(event: any) {
    var value = +event.target.value;

    options.legend!.item!.maxWidth = value;
    chart.update(options);

    document.getElementById('maxWidthValue')!.innerHTML = String(value);
}
