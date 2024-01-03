import type { AxisConstructor } from '../../module/coreModules';
import type { ModuleContext } from '../../module/moduleContext';
import { CategoryAxis } from '../axis/categoryAxis';
import { GroupedCategoryAxis } from '../axis/groupedCategoryAxis';
import { LogAxis } from '../axis/logAxis';
import { NumberAxis } from '../axis/numberAxis';
import { TimeAxis } from '../axis/timeAxis';

const AXIS_CONSTRUCTORS: Record<string, AxisConstructor> = {
    [NumberAxis.type]: NumberAxis,
    [CategoryAxis.type]: CategoryAxis,
    [TimeAxis.type]: TimeAxis,
    [GroupedCategoryAxis.type]: GroupedCategoryAxis,
    [LogAxis.type]: LogAxis,
};

export function registerAxis(axisType: string, ctor: AxisConstructor) {
    AXIS_CONSTRUCTORS[axisType] = ctor;
}

export function getAxis(axisType: string, moduleCtx: ModuleContext) {
    const axisConstructor = AXIS_CONSTRUCTORS[axisType];
    if (axisConstructor) {
        return new axisConstructor(moduleCtx);
    }

    throw new Error(`AG Charts - unknown axis type: ${axisType}`);
}

export const AXIS_TYPES = {
    has(axisType: string) {
        return Object.hasOwn(AXIS_CONSTRUCTORS, axisType);
    },

    get axesTypes() {
        return Object.keys(AXIS_CONSTRUCTORS);
    },
};

const AXIS_THEME_TEMPLATES: Record<string, {}> = {};

export function registerAxisThemeTemplate(axisType: string, theme: {}) {
    AXIS_THEME_TEMPLATES[axisType] = theme;
}

export function getAxisThemeTemplate(axisType: string): {} {
    return AXIS_THEME_TEMPLATES[axisType] ?? {};
}
