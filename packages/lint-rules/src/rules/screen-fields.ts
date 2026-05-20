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
 *
 * Expected columns (from screen-spec.ts):
 * - name (項目名) - required
 * - fieldKey (項目キー) - required
 * - inputType (入力形式) - required
 * - required (必須) - required
 * - editable (編集可) - optional
 * - visibleCondition (表示条件) - optional
 * - validationRule (入力制御) - optional
 * - note (備考) - optional
 */
export function validateScreenFields(
  context: TableValidationContext
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  // Check for duplicate field keys
  issues.push(...validateDuplicateKeys(context, "fieldKey", "項目キー"));

  // Check for empty rows
  issues.push(
    ...validateEmptyRows(context, ["name", "fieldKey"], "画面項目")
  );

  // Check required fields
  issues.push(
    ...validateRequiredTableFields(context, [
      { key: "name", label: "項目名" },
      { key: "fieldKey", label: "項目キー" },
      { key: "inputType", label: "入力形式" },
    ])
  );

  // Validate field-specific rules
  context.rows.forEach((row, rowIndex) => {
    // Skip empty rows
    if (isCellEmpty(row["name"]) && isCellEmpty(row["fieldKey"])) return;

    // Check fieldKey format (should start with letter, contain only alphanumeric and underscore)
    const fieldKey = getDisplayValue(row["fieldKey"]);
    if (fieldKey && !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(fieldKey)) {
      issues.push(
        createIssue(
          `invalid-field-key-format-${rowIndex}`,
          "warning",
          `行${rowIndex + 1}の項目キー「${fieldKey}」は英字で始まり、英数字とアンダースコアのみを含む形式を推奨します`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
            cellKey: "fieldKey",
          }
        )
      );
    }

    // Check input type specific validations
    const inputType = getDisplayValue(row["inputType"]);

    // Validate select/radio options - but note: current schema doesn't have options column
    // This check is for future compatibility or custom schemas
    if (
      (inputType === "select" || inputType === "radio" || inputType === "checkbox") &&
      row["options"] !== undefined &&
      isCellEmpty(row["options"])
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
    const isRequired = row["required"] === true || row["required"] === "true";
    if (isRequired && isCellEmpty(row["validationRule"])) {
      issues.push(
        createIssue(
          `required-without-validation-${rowIndex}`,
          "info",
          `行${rowIndex + 1}は必須項目ですが、入力制御が設定されていません`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
            cellKey: "validationRule",
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
    fieldKey === "screen-fields" ||
    fieldKey === "fields" ||
    fieldKey === "screenFields" ||
    fieldKey === "inputFields" ||
    fieldKey === "formFields"
  );
}
