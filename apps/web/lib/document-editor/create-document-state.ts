import type { Document, Field } from "@specforge/document-schema";

export type TableRowValue = Record<string, string | number | boolean | undefined>;
export type FieldValue = string | number | boolean | TableRowValue[] | undefined;

export interface DocumentEditorState {
  document: Document;
  fieldValues: Record<string, FieldValue>;
}

function collectFieldDefaults(fields: Field[]): Record<string, FieldValue> {
  return fields.reduce<Record<string, FieldValue>>((accumulator, field) => {
    if (field.valueType === "table") {
      accumulator[field.id] = field.table?.defaultRows ?? [];
    } else {
      accumulator[field.id] = field.defaultValue;
    }
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
