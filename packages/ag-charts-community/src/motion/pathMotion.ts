import type { AnimationManager } from '../chart/interaction/animationManager';
import type { Path } from '../scene/shape/path';
import * as easing from './easing';
import { FROM_TO_MIXINS, type NodeUpdateState } from './fromToMotion';

/**
 * Implements a per-path "to/from" animation.
 *
 * @param id prefix for all animation ids generated by this call
 * @param animationManager used to schedule generated animations
 * @param paths contains paths to be animated
 * @param intermediateFn callback to update path
 * @param extraOpts optional additional animation properties to pass to AnimationManager#animate.
 */
export function pathMotion(
    id: string,
    animationManager: AnimationManager,
    paths: Path[],
    fns: {
        intermediateFn: (ratio: number, path: Path) => void;
    },
    extraOpts?: { status?: NodeUpdateState }
) {
    const { defaultDuration } = animationManager;
    const { status = 'unknown' } = extraOpts ?? {};
    const { animationDelay, animationDuration } = FROM_TO_MIXINS[status];
    const { intermediateFn } = fns;

    for (const path of paths) {
        animationManager.animate({
            id: `${id}_${path.id}`,
            from: 0,
            to: 1,
            ease: easing.easeOut,
            onUpdate(ratio) {
                path.path.clear({ trackChanges: true });
                intermediateFn(ratio, path);
                path.checkPathDirty();
            },
            onStop() {
                path.path.clear({ trackChanges: true });
                intermediateFn(1, path);
                path.checkPathDirty();
            },
            duration: animationDuration * defaultDuration,
            delay: animationDelay * defaultDuration,
        });
    }
}
