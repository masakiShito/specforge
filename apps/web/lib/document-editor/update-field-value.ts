import type { DocumentEditorState, FieldValue } from "./create-document-state";

export function updateFieldValue(
  state: DocumentEditorState,
  fieldId: string,
  value: FieldValue
): DocumentEditorState {
  return {
    ...state,
    fieldValues: {
      ...state.fieldValues,
      [fieldId]: value
    }
  };
}
