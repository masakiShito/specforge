import type { Document, Field } from "@specforge/document-schema";

export type FieldValue = string | number | boolean | undefined;

export interface DocumentEditorState {
  document: Document;
  fieldValues: Record<string, FieldValue>;
}

function collectFieldDefaults(fields: Field[]): Record<string, FieldValue> {
  return fields.reduce<Record<string, FieldValue>>((accumulator, field) => {
    accumulator[field.id] = field.defaultValue;
    return accumulator;
  }, {});
}

export function createDocumentState(document: Document): DocumentEditorState {
  const fieldValues = document.sections.reduce<Record<string, FieldValue>>((accumulator, section) => {
    return {
      ...accumulator,
      ...collectFieldDefaults(section.fields)
    };
  }, {});

  return {
    document,
    fieldValues
  };
}
