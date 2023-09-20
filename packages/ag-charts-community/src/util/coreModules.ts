import type { BaseModule, ModuleInstance } from './baseModule';
import type { ChartAxis } from '../chart/chartAxis';
import type { Series } from '../chart/series/series';
import type { ChartLegend, ChartLegendType } from '../chart/legendDatum';
import type { ModuleContext } from './moduleContext';
import type { AgBaseChartThemeOverrides, AgChartOptions } from '../options/agChartOptions';

export type AxisConstructor = new (moduleContext: ModuleContext) => ChartAxis;
export type SeriesConstructor = new (moduleContext: ModuleContext) => Series<any>;
export type LegendConstructor = new (moduleContext: ModuleContext) => ChartLegend;

interface SeriesPaletteOptions {
    stroke?: string;
    fill?: string;
    fills?: string[];
    strokes?: string[];
    marker?: { fill?: string; stroke?: string };
}
interface SeriesPaletteFactoryParams {
    takeColors: (count: number) => { fills: string[]; strokes: string[] };
    colorsCount: number;
}
export type SeriesPaletteFactory = (params: SeriesPaletteFactoryParams) => SeriesPaletteOptions;

export interface RootModule<M extends ModuleInstance = ModuleInstance> extends BaseModule {
    type: 'root';

    instanceConstructor: new (ctx: ModuleContext) => M;

    themeTemplate?: {};
}

export interface AxisModule extends BaseModule {
    type: 'axis';

    identifier: string;
    instanceConstructor: AxisConstructor;

    themeTemplate: {};
}

export interface LegendModule extends BaseModule {
    type: 'legend';

    identifier: ChartLegendType;
    instanceConstructor: LegendConstructor;

    themeTemplate?: {};
}

type RequiredSeriesType = NonNullable<NonNullable<AgChartOptions['series']>[number]['type']>;
type Extensible<T> = { [K in keyof T]?: NonNullable<T[K]> extends object ? Extensible<T[K]> : T[K] } & {
    __extends__?: string;
};
type SeriesTheme<SeriesType extends RequiredSeriesType> = NonNullable<AgBaseChartThemeOverrides[SeriesType]>['series'];
type ExtensibleTheme<SeriesType extends RequiredSeriesType> = Extensible<SeriesTheme<SeriesType>>;

export interface SeriesModule<SeriesType extends RequiredSeriesType = RequiredSeriesType> extends BaseModule {
    type: 'series';

    identifier: SeriesType;
    instanceConstructor: SeriesConstructor;

    seriesDefaults: AgChartOptions;
    themeTemplate: ExtensibleTheme<SeriesType>;
    paletteFactory?: SeriesPaletteFactory;
    stackable?: boolean;
    groupable?: boolean;
    stackedByDefault?: boolean;
    swapDefaultAxesCondition?: (opts: AgChartOptions) => boolean;
}
