import type { Field } from "@specforge/document-schema";

import type { DocumentEditorState, FieldValue } from "./create-document-state";

export interface ValidationWarning {
  id: string;
  sectionId: string;
  sectionTitle: string;
  fieldId: string;
  fieldLabel: string;
  message: string;
}

export interface DocumentValidationResult {
  warnings: ValidationWarning[];
  missingRequiredBySection: Record<string, number>;
}

function isRequiredFieldMissing(field: Field, value: FieldValue): boolean {
  if (!field.required) {
    return false;
  }

  if (value === undefined || value === null) {
    return true;
  }

  if ((field.valueType === "text" || field.valueType === "textarea" || field.valueType === "enum") && value === "") {
    return true;
  }

  return false;
}

export function validateDocument(state: DocumentEditorState): DocumentValidationResult {
  const warnings: ValidationWarning[] = [];
  const missingRequiredBySection: Record<string, number> = {};

  state.document.sections.forEach((section) => {
    let missingCount = 0;

    section.fields.forEach((field) => {
      const value = state.fieldValues[field.id];

      if (!isRequiredFieldMissing(field, value)) {
        return;
      }

      missingCount += 1;

      warnings.push({
        id: `${section.id}:${field.id}:required`,
        sectionId: section.id,
        sectionTitle: section.title,
        fieldId: field.id,
        fieldLabel: field.label,
        message: "Required field is empty"
      });
    });

    missingRequiredBySection[section.id] = missingCount;
  });

  return {
    warnings,
    missingRequiredBySection
  };
}
