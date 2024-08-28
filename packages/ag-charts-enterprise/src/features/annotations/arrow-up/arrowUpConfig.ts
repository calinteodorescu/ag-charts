import { AnnotationType } from '../annotationTypes';
import type { AnnotationTypeConfig } from '../annotationsSuperTypes';
import { DragStateMachine } from '../states/dragState';
import { ArrowUpProperties } from './arrowUpProperties';
import { ArrowUpScene } from './arrowUpScene';
import { ArrowUpStateMachine } from './arrowUpState';

export const arrowUpConfig: AnnotationTypeConfig<ArrowUpProperties, ArrowUpScene> = {
    type: AnnotationType.ArrowUp,
    datum: ArrowUpProperties,
    scene: ArrowUpScene,
    isDatum: ArrowUpProperties.is,
    update: (node, datum, context) => {
        if (ArrowUpProperties.is(datum) && ArrowUpScene.is(node)) {
            node.update(datum, context);
        }
    },
    createState: (ctx, { createDatum, getNode }) =>
        new ArrowUpStateMachine({
            ...ctx,
            create: createDatum(AnnotationType.ArrowUp),
            node: getNode(ArrowUpScene.is),
        }),
    dragState: (ctx, { getDatum, getNode }) =>
        new DragStateMachine<ArrowUpProperties, ArrowUpScene>({
            ...ctx,
            datum: getDatum(ArrowUpProperties.is),
            node: getNode(ArrowUpScene.is),
        }),
};