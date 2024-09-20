import { _ModuleSupport } from 'ag-charts-community';

import { Annotation, Handle, Line, Localisable } from '../annotationProperties';
import { type AnnotationContext, type AnnotationOptionsColorPickerType } from '../annotationTypes';

const { BaseProperties } = _ModuleSupport;

export class StartEndProperties extends Annotation(Localisable(Line(Handle(BaseProperties)))) {
    override isValidWithContext(_context: AnnotationContext, warningPrefix?: string) {
        return super.isValid(warningPrefix);
    }

    getDefaultColor(_colorPickerType: AnnotationOptionsColorPickerType): string | undefined {
        return undefined;
    }

    getDefaultOpacity(_colorPickerType: AnnotationOptionsColorPickerType): number | undefined {
        return undefined;
    }
}
