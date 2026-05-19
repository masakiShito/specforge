import type {
  DesignValidationIssue,
  TableValidationContext,
  TableRowValue,
} from "../types";
import {
  createIssue,
  validateDuplicateKeys,
  validateEmptyRows,
  validateRequiredTableFields,
  isCellEmpty,
  getDisplayValue,
} from "./common";

/**
 * Validate screen fields table
 */
export function validateScreenFields(
  context: TableValidationContext
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  // Check for duplicate field IDs
  issues.push(...validateDuplicateKeys(context, "id", "項目ID"));

  // Check for empty rows
  issues.push(
    ...validateEmptyRows(context, ["id", "label"], "画面項目")
  );

  // Check required fields
  issues.push(
    ...validateRequiredTableFields(context, [
      { key: "id", label: "項目ID" },
      { key: "label", label: "ラベル" },
      { key: "type", label: "入力形式" },
    ])
  );

  // Validate field-specific rules
  context.rows.forEach((row, rowIndex) => {
    // Skip empty rows
    if (isCellEmpty(row.id) && isCellEmpty(row.label)) return;

    // Check ID format (should start with letter, contain only alphanumeric and underscore)
    const fieldId = getDisplayValue(row.id);
    if (fieldId && !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(fieldId)) {
      issues.push(
        createIssue(
          `invalid-field-id-format-${rowIndex}`,
          "warning",
          `行${rowIndex + 1}の項目ID「${fieldId}」は英字で始まり、英数字とアンダースコアのみを含む形式を推奨します`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
            cellKey: "id",
          }
        )
      );
    }

    // Check if maxLength is set for text inputs
    const inputType = getDisplayValue(row.type);
    if (
      (inputType === "text" || inputType === "textarea") &&
      isCellEmpty(row.maxLength)
    ) {
      issues.push(
        createIssue(
          `missing-max-length-${rowIndex}`,
          "info",
          `行${rowIndex + 1}の${inputType}入力には最大文字数の設定を推奨します`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
            cellKey: "maxLength",
          }
        )
      );
    }

    // Validate select/radio options
    if (
      (inputType === "select" || inputType === "radio" || inputType === "checkbox") &&
      isCellEmpty(row.options)
    ) {
      issues.push(
        createIssue(
          `missing-options-${rowIndex}`,
          "error",
          `行${rowIndex + 1}の${inputType}には選択肢の設定が必要です`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
            cellKey: "options",
          }
        )
      );
    }

    // Check for validation rules when field is required
    const isRequired = row.required === true || row.required === "true";
    if (isRequired && isCellEmpty(row.validation)) {
      issues.push(
        createIssue(
          `required-without-validation-${rowIndex}`,
          "info",
          `行${rowIndex + 1}は必須項目ですが、バリデーションルールが設定されていません`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
            cellKey: "validation",
          }
        )
      );
    }
  });

  return issues;
}

/**
 * Check if the table is a screen fields table
 */
export function isScreenFieldsTable(fieldKey: string): boolean {
  return (
    fieldKey === "fields" ||
    fieldKey === "screenFields" ||
    fieldKey === "inputFields" ||
    fieldKey === "formFields"
  );
}
