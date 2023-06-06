import { LinearScale } from '../../scale/linearScale';
import { ModuleContext } from '../../util/module';
import { ChartAxis } from '../chartAxis';
import { ChartAxisDirection } from '../chartAxisDirection';

export class RadiusNumberAxis extends ChartAxis {
    static className = 'RadiusNumberAxis';
    static type = 'polar-radius-number' as const;

    constructor(moduleCtx: ModuleContext) {
        super(moduleCtx, new LinearScale());
        this.radialGrid = true;
    }

    get direction() {
        return ChartAxisDirection.Y;
    }

    update(primaryTickCount?: number) {
        primaryTickCount = super.update(primaryTickCount);
        this.updateGridArcs();
        return primaryTickCount;
    }

    private updateGridArcs() {
        const { scale, gridStyle, tick } = this;
        if (!gridStyle) {
            return;
        }

        const maxRadius = scale.range[0];
        const ticks = scale.ticks?.() || [];
        ticks.sort((a, b) => b - a); // Apply grid styles starting from the largest arc
        this.gridArcGroup.translationY = maxRadius;
        this.gridArcGroupSelection.update(ticks.reverse()).each((node, value, index) => {
            const style = gridStyle[index % gridStyle.length];
            node.stroke = style.stroke;
            node.strokeWidth = tick.width;
            node.lineDash = style.lineDash;
            node.fill = undefined;

            node.centerX = 0;
            node.centerY = 0;
            node.radius = scale.convert(value);
            node.startAngle = 0;
            node.endAngle = 2 * Math.PI;
        });
    }
}
