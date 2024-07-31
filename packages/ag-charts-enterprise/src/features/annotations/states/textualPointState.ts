import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import type { Point } from '../annotationTypes';
import type { AnnotationsStateMachineContext } from '../annotationsSuperTypes';
import type { TextualPointProperties } from '../properties/textualPointProperties';
import type { TextualPointScene } from '../scenes/textualPointScene';

const { StateMachine } = _ModuleSupport;

interface TextualPointStateMachineContext<Datum extends TextualPointProperties, Node extends TextualPointScene<Datum>>
    extends Omit<AnnotationsStateMachineContext, 'create' | 'delete' | 'datum' | 'node' | 'showTextInput'> {
    create: (datum: Datum) => void;
    delete: () => void;
    datum: () => Datum | undefined;
    node: () => Node | undefined;
    showTextInput: () => void;
}

export abstract class TextualPointStateMachine<
    Datum extends TextualPointProperties,
    Node extends TextualPointScene<Datum>,
> extends StateMachine<
    'start' | 'waiting-first-render' | 'edit',
    'click' | 'cancel' | 'keyDown' | 'showTextInput' | 'render'
> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(ctx: TextualPointStateMachineContext<Datum, Node>) {
        const actionCreate = ({ point }: { point: Point }) => {
            const datum = this.createDatum();
            datum.set({ x: point.x, y: point.y });
            ctx.create(datum);
        };

        const actionFirstRender = () => {
            ctx.node()?.toggleActive(true);
            ctx.showAnnotationOptions();
            ctx.update();
        };

        const onStartEditing = () => {
            ctx.showTextInput();
            const datum = ctx.datum();
            if (datum) {
                datum.visible = false;
            }
        };

        const onStopEditing = () => {
            ctx.hideTextInput();
            const datum = ctx.datum();
            if (datum) {
                datum.visible = true;
            }
        };

        const actionShowTextInput = (bbox: _Scene.BBox) => {
            const node = ctx.node();
            node?.setTextInputBBox(bbox);
            ctx.update();
        };

        const actionCancel = () => {
            ctx.delete();
        };

        const actionSave = ({ textInputValue }: { textInputValue?: string }) => {
            if (textInputValue != null && textInputValue.length > 0) {
                ctx.datum()?.set({ text: textInputValue });
                ctx.update();
            } else {
                ctx.delete();
            }
        };

        const guardCancelAndExit = ({ key }: { key: string }) => key === 'Escape';
        const guardSaveAndExit = ({ key, shiftKey }: { key: string; shiftKey: boolean }) =>
            !shiftKey && key === 'Enter';

        super('start', {
            start: {
                click: {
                    target: 'waiting-first-render',
                    action: actionCreate,
                },
                cancel: StateMachine.parent,
            },
            'waiting-first-render': {
                render: {
                    target: 'edit',
                    action: actionFirstRender,
                },
            },
            edit: {
                onEnter: onStartEditing,
                showTextInput: actionShowTextInput,
                keyDown: [
                    {
                        guard: guardCancelAndExit,
                        target: StateMachine.parent,
                        action: actionCancel,
                    },
                    {
                        guard: guardSaveAndExit,
                        target: StateMachine.parent,
                        action: actionSave,
                    },
                ],
                click: {
                    target: StateMachine.parent,
                    action: actionSave,
                },
                cancel: StateMachine.parent,
                onExit: onStopEditing,
            },
        });
    }

    protected abstract createDatum(): Datum;
}
