import type { AgOhlcSeriesItemOptions } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';

import { CandlestickBaseGroup } from '../candlestick/candlestickGroup';
import type { OhlcNodeDatum } from './ohlcTypes';

export enum GroupTags {
    Body,
    Open,
    Close,
}

export class OhlcGroup extends CandlestickBaseGroup<
    OhlcNodeDatum,
    _ModuleSupport.DeepRequired<AgOhlcSeriesItemOptions>
> {
    constructor() {
        super();
        this.append([
            new _Scene.Line({ tag: GroupTags.Body }),
            new _Scene.Line({ tag: GroupTags.Open }),
            new _Scene.Line({ tag: GroupTags.Close }),
        ]);
    }

    updateCoordinates() {
        const {
            x,
            y,
            yBottom,
            yHigh,
            yLow,
            width,
            height,
            datum: { itemId },
        } = this;
        const selection = _Scene.Selection.select(this, _Scene.Rect);
        const [body] = selection.selectByTag<_Scene.Line>(GroupTags.Body);
        const [open] = selection.selectByTag<_Scene.Line>(GroupTags.Open);
        const [close] = selection.selectByTag<_Scene.Line>(GroupTags.Close);

        if (width === 0 || height === 0) {
            body.visible = false;
            open.visible = false;
            close.visible = false;
            return;
        }

        body.visible = true;
        open.visible = true;
        close.visible = true;

        const halfWidth = width / 2;

        body.setProperties({
            x1: Math.floor(x + halfWidth),
            x2: Math.floor(x + halfWidth),
            y1: yHigh,
            y2: yLow,
        });

        const isRising = itemId === 'up';
        const openY = isRising ? yBottom : y;
        const closeY = isRising ? y : yBottom;
        open.setProperties({
            x1: Math.floor(x),
            x2: Math.floor(x + halfWidth),
            y: Math.round(openY),
        });

        close.setProperties({
            x1: Math.floor(x + halfWidth),
            x2: Math.floor(x + width),
            y: Math.round(closeY),
        });
    }

    updateDatumStyles(_datum: OhlcNodeDatum, activeStyles: _ModuleSupport.DeepRequired<AgOhlcSeriesItemOptions>) {
        const selection = _Scene.Selection.select(this, _Scene.Rect);
        const [body] = selection.selectByTag<_Scene.Line>(GroupTags.Body);
        const [open] = selection.selectByTag<_Scene.Line>(GroupTags.Open);
        const [close] = selection.selectByTag<_Scene.Line>(GroupTags.Close);

        body.setProperties(activeStyles);
        open.setProperties(activeStyles);
        close.setProperties(activeStyles);
    }
}
