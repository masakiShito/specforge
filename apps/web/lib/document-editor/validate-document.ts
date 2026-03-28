import type { Field } from "@specforge/document-schema";

import type { DocumentEditorState, FieldValue, TableRowValue } from "./create-document-state";

export interface ValidationWarning {
  id: string;
  sectionId: string;
  sectionTitle: string;
  fieldId: string;
  fieldLabel: string;
  message: string;
  /** For table cell errors, identifies the specific cell */
  cellKey?: string;
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

  if (field.valueType === "reference" && typeof value === "object" && value !== null && !("refId" in value)) {
    return true;
  }

  return false;
}

function isCellEmpty(value: FieldValue | TableRowValue[string]): boolean {
  return value === undefined || value === null || value === "";
}

function isRowEmpty(row: TableRowValue, columns: Field[]): boolean {
  return columns.every((col) => isCellEmpty(row[col.key]));
}

function validateTableField(
  field: Field,
  rows: TableRowValue[],
  sectionId: string,
  sectionTitle: string
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const table = field.table;
  if (!table) return warnings;

  const columns = table.columns;

  // Required table with no rows
  if (field.required && rows.length === 0) {
    warnings.push({
      id: `${sectionId}:${field.id}:table-empty`,
      sectionId,
      sectionTitle,
      fieldId: field.id,
      fieldLabel: field.label,
      message: "テーブルに行が追加されていません",
    });
    return warnings;
  }

  rows.forEach((row, rowIndex) => {
    // Empty row check
    if (isRowEmpty(row, columns)) {
      warnings.push({
        id: `${sectionId}:${field.id}:row${rowIndex}:empty`,
        sectionId,
        sectionTitle,
        fieldId: field.id,
        fieldLabel: field.label,
        message: `行 ${rowIndex + 1} がすべて空です`,
      });
      return;
    }

    // Required cell check
    columns.forEach((col) => {
      if (!col.required) return;
      if (isCellEmpty(row[col.key])) {
        warnings.push({
          id: `${sectionId}:${field.id}:row${rowIndex}:${col.key}:required`,
          sectionId,
          sectionTitle,
          fieldId: field.id,
          fieldLabel: field.label,
          message: `行 ${rowIndex + 1} の「${col.label}」は必須です`,
          cellKey: `${field.id}:row${rowIndex}:${col.key}`,
        });
      }
    });
  });

  return warnings;
}

export function validateDocument(state: DocumentEditorState): DocumentValidationResult {
  const warnings: ValidationWarning[] = [];
  const missingRequiredBySection: Record<string, number> = {};

  state.document.sections.forEach((section) => {
    let missingCount = 0;

    section.fields.forEach((field) => {
      const value = state.fieldValues[field.id];

      // Table field validation
      if (field.valueType === "table" && field.table) {
        const rows = Array.isArray(value) ? (value as TableRowValue[]) : [];
        const tableWarnings = validateTableField(field, rows, section.id, section.title);
        if (tableWarnings.length > 0) {
          missingCount += tableWarnings.length;
          warnings.push(...tableWarnings);
        }
        return;
      }

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
