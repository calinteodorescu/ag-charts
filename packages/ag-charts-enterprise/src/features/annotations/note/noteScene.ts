import { _Scene, _Util } from 'ag-charts-community';

import { AnnotationType } from '../annotationTypes';
import { AnnotationScene } from '../scenes/annotationScene';
import { TextualScene } from '../scenes/textualScene';
import type { NoteProperties } from './noteProperties';

export class NoteScene extends TextualScene<NoteProperties> {
    static override is(value: unknown): value is NoteScene {
        return AnnotationScene.isCheck(value, AnnotationType.Note);
    }

    override type = AnnotationType.Note;

    constructor() {
        super();
        this.append([this.label, this.handle]);
    }

    protected override updateShape(_datum: NoteProperties) {
        // TODO
    }
}