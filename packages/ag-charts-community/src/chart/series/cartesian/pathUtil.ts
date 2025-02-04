import { staticFromToMotion } from '../../../motion/fromToMotion';
import type { Point } from '../../../scene/point';
import type { Selection } from '../../../scene/selection';
import type { Path } from '../../../scene/shape/path';
import type { AnimationManager } from '../../interaction/animationManager';
import type { NodeDataDependant } from '../seriesTypes';
import type { CartesianSeriesNodeDatum } from './cartesianSeries';
import type { InterpolationProperties } from './interpolationProperties';
import { plotLinearPoints, plotSmoothPoints, plotStepPoints } from './linePlotter';

export interface PartialPathPoint extends Point {
    moveTo: boolean;
}

export type PathPointChange = 'move' | 'in' | 'out';

export type PathPoint = {
    from?: Point;
    to?: Point;
    change: PathPointChange;
    moveTo: true | false | 'in' | 'out';
};
export type PathPointMap<ARRAY extends boolean = false> = {
    [key in 'moved' | 'added' | 'removed']: { [key: string]: ARRAY extends true ? PathPoint[] : PathPoint };
};
export interface PathNodeDatumLike extends Pick<CartesianSeriesNodeDatum, 'xValue'> {
    readonly point: Point & { moveTo?: boolean };
}

export function minMax(nodeData: PathNodeDatumLike[]) {
    return nodeData.reduce<{ min?: PathNodeDatumLike; max?: PathNodeDatumLike }>(
        ({ min, max }, node: PathNodeDatumLike) => {
            if (min == null || min.point.x > node.point.x) {
                min = node;
            }
            if (max == null || max.point.x < node.point.x) {
                max = node;
            }
            return { min, max };
        },
        {}
    );
}

function intersectionOnLine(a: { x: number; y: number }, b: { x: number; y: number }, targetX: number) {
    const m = (b.y - a.y) / (b.x - a.x);
    // Find a point a distance along the line from `a` and `b`
    const y = (targetX - a.x) * m + a.y;
    return { x: targetX, y };
}

function backfillPathPoint(
    results: PathPoint[],
    process: PathPointChange,
    skip: PathPointChange,
    processFn: (toProcess: PathPoint[], prevMarkerIdx: number, nextMarkerIdx: number) => void
) {
    let prevMarkerIdx = -1,
        nextMarkerIdx = 0;
    const toProcess: PathPoint[] = [];
    while (nextMarkerIdx < results.length) {
        if (results[nextMarkerIdx].change === process) {
            toProcess.push(results[nextMarkerIdx]);
            nextMarkerIdx++;
            continue;
        }

        if (results[nextMarkerIdx].change === skip) {
            nextMarkerIdx++;
            continue;
        }

        if (toProcess.length > 0) {
            processFn(toProcess, prevMarkerIdx, nextMarkerIdx);
            toProcess.length = 0;
        }
        prevMarkerIdx = nextMarkerIdx;
        nextMarkerIdx++;
    }

    if (toProcess.length > 0) {
        processFn(toProcess, prevMarkerIdx, nextMarkerIdx);
    }
}

export type BackfillSplitMode = 'intersect' | 'static';
export type BackfillAddMode = 'fan-out' | 'static';
export function backfillPathPointData(result: PathPoint[], splitMode: BackfillSplitMode) {
    backfillPathPoint(result, 'out', 'in', (toProcess, sIdx, eIdx) => {
        if (sIdx === -1 && result[eIdx]) {
            toProcess.forEach((d) => (d.to = result[eIdx].from));
        } else if (eIdx === result.length && result[sIdx]) {
            toProcess.forEach((d) => (d.to = result[sIdx].from));
        } else if (splitMode === 'intersect' && result[sIdx]?.from && result[eIdx]?.from) {
            toProcess.forEach((d) => (d.to = intersectionOnLine(result[sIdx].from!, result[eIdx].from!, d.from!.x)));
        } else {
            toProcess.forEach((d) => (d.to = d.from));
        }
    });

    backfillPathPoint(result, 'in', 'out', (toProcess, sIdx, eIdx) => {
        if (sIdx === -1 && result[eIdx]) {
            toProcess.forEach((d) => (d.from = result[eIdx].to));
        } else if (eIdx === result.length && result[sIdx]) {
            toProcess.forEach((d) => (d.from = result[sIdx].to));
        } else if (splitMode === 'intersect' && result[sIdx]?.to && result[eIdx]?.to) {
            toProcess.forEach((d) => (d.from = intersectionOnLine(result[sIdx].to!, result[eIdx].to!, d.to!.x)));
        } else {
            toProcess.forEach((d) => (d.from = d.to));
        }
    });
}

function calculatePoint(from: Point, to: Point, ratio: number): Point {
    const x1 = isNaN(from.x) ? to.x : from.x;
    const y1 = isNaN(from.y) ? to.y : from.y;
    const xd = to.x - from.x;
    const yd = to.y - from.y;
    const xr = isNaN(xd) ? 0 : xd * ratio;
    const yr = isNaN(yd) ? 0 : yd * ratio;
    return {
        x: x1 + xr,
        y: y1 + yr,
    };
}

const lineSteps = {
    start: 0,
    middle: 0.5,
    end: 1,
};

export function plotPath(
    points: Iterable<Point>,
    path: Path,
    interpolation: InterpolationProperties | undefined,
    continuePath = false
) {
    const { path: linePath } = path;

    if (interpolation?.type === 'smooth') {
        plotSmoothPoints(linePath, points, interpolation.tension ?? 1, continuePath);
    } else if (interpolation?.type === 'step') {
        plotStepPoints(linePath, points, lineSteps[interpolation.position ?? 'end'], continuePath);
    } else {
        plotLinearPoints(linePath, points, continuePath);
    }
}

export function splitPairData(pairData: PathPoint[], ratios: Partial<Record<PathPointChange, number>>): Point[][] {
    let previousTo: PathPoint['to'];
    let points: Point[] | undefined = undefined;
    const out: Point[][] = [];

    const flushCurrent = () => {
        if (points != null) {
            out.push(points);
            points = undefined;
        }
    };

    for (const data of pairData) {
        const { from, to } = data;
        const ratio = ratios[data.change];

        if (ratio == null || from == null || to == null) continue;

        const point = calculatePoint(from, to, ratio);
        if (data.moveTo === false) {
            points ??= [];
            points.push(point);
        } else if (data.moveTo === true || !previousTo) {
            flushCurrent();
            points = [point];
        } else if (previousTo) {
            const moveToRatio = data.moveTo === 'in' ? ratio : 1 - ratio;
            const { x: midPointX, y: midPointY } = calculatePoint(previousTo, point, moveToRatio);

            points ??= [];
            points.push({ x: midPointX, y: midPointY });

            flushCurrent();
            points = [point];
        }
        previousTo = point;
    }

    flushCurrent();

    return out;
}

export function renderPartialPath(
    pairData: PathPoint[],
    ratios: Partial<Record<PathPointChange, number>>,
    path: Path,
    interpolation: InterpolationProperties | undefined
) {
    splitPairData(pairData, ratios).forEach((points) => {
        plotPath(points, path, interpolation);
    });
}

export function pathSwipeInAnimation(
    { id, visible, nodeDataDependencies }: { id: string; visible: boolean } & NodeDataDependant,
    animationManager: AnimationManager,
    ...paths: Path[]
) {
    const { seriesRectWidth: width, seriesRectHeight: height } = nodeDataDependencies;
    staticFromToMotion(
        id,
        'path_properties',
        animationManager,
        paths,
        { clipX: 0 },
        { clipX: width },
        {
            phase: 'initial',
            start: { clip: true, clipY: height, visible },
            finish: { clip: false, visible },
        }
    );
}

export function pathFadeInAnimation<T>(
    { id }: { id: string },
    subId: string,
    animationManager: AnimationManager,
    phase: 'add' | 'trailing' = 'add',
    ...selection: Selection<Path, T>[] | Path[]
) {
    staticFromToMotion(id, subId, animationManager, selection, { opacity: 0 }, { opacity: 1 }, { phase });
}

export function pathFadeOutAnimation<T>(
    { id }: { id: string },
    subId: string,
    animationManager: AnimationManager,
    ...selection: Selection<Path, T>[] | Path[]
) {
    staticFromToMotion(id, subId, animationManager, selection, { opacity: 1 }, { opacity: 0 }, { phase: 'remove' });
}

export function buildResetPathFn(opts: { getVisible(): boolean; getOpacity(): number }) {
    return (_node: Path) => ({
        visible: opts.getVisible(),
        opacity: opts.getOpacity(),
        clipScalingX: 1,
        clip: false,
    });
}

export function updateClipPath({ nodeDataDependencies }: NodeDataDependant, path: Path): void {
    const toFinite = (value: number) => (isFinite(value) ? value : 0);
    path.clipX = toFinite(nodeDataDependencies.seriesRectWidth);
    path.clipY = toFinite(nodeDataDependencies.seriesRectHeight);
}
