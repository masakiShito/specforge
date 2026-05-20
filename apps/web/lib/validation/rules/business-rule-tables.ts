import type { Field } from "@specforge/document-schema";
import type { TableRowValue } from "../../document-editor/create-document-state";
import type { DesignValidationIssue, TableValidationContext } from "../types";
import { validateUniqueness, validateRequiredColumns, createIssue } from "./common";

/**
 * Validate conditions table
 * - Condition ID must be unique
 * - Required columns must be filled
 */
export function validateConditions(
  rows: TableRowValue[],
  columns: Field[],
  ctx: TableValidationContext
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  // Validate required columns
  issues.push(...validateRequiredColumns(rows, columns, ctx));

  // Validate unique condition IDs
  issues.push(...validateUniqueness(rows, "conditionId", "条件ID", ctx));

  return issues;
}

/**
 * Validate rules table
 * - Rule ID must be unique
 * - Required columns must be filled
 * - Validate condition-action consistency
 */
export function validateRules(
  rows: TableRowValue[],
  columns: Field[],
  ctx: TableValidationContext
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  // Validate required columns
  issues.push(...validateRequiredColumns(rows, columns, ctx));

  // Validate unique rule IDs
  issues.push(...validateUniqueness(rows, "ruleId", "ルールID", ctx));

  // Check for rules with condition but no action (or vice versa)
  rows.forEach((row, rowIndex) => {
    const condition = row.condition;
    const action = row.action;

    if (condition && !action) {
      issues.push(
        createIssue({
          ...ctx,
          rowIndex,
          columnKey: "action",
          severity: "warning",
          message: "条件は定義されていますが、アクションが未入力です",
        })
      );
    }

    if (action && !condition) {
      issues.push(
        createIssue({
          ...ctx,
          rowIndex,
          columnKey: "condition",
          severity: "warning",
          message: "アクションは定義されていますが、適用条件が未入力です",
        })
      );
    }
  });

  return issues;
}

/**
 * Validate exceptions table
 * - Exception ID must be unique
 * - Related rule ID should exist in rules table (can't verify cross-table here, but format check)
 * - Required columns must be filled
 */
export function validateExceptions(
  rows: TableRowValue[],
  columns: Field[],
  ctx: TableValidationContext
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  // Validate required columns
  issues.push(...validateRequiredColumns(rows, columns, ctx));

  // Validate unique exception IDs
  issues.push(...validateUniqueness(rows, "exceptionId", "例外ID", ctx));

  // Check that related rule ID is filled
  rows.forEach((row, rowIndex) => {
    const relatedRuleId = row.relatedRuleId;
    if (!relatedRuleId) {
      issues.push(
        createIssue({
          ...ctx,
          rowIndex,
          columnKey: "relatedRuleId",
          severity: "warning",
          message: "関連ルールIDが指定されていません",
        })
      );
    }
  });

  return issues;
}

/**
 * Validate validations table
 * - Validation ID must be unique
 * - Required columns must be filled
 * - Error message should be appropriate for validation type
 */
export function validateValidations(
  rows: TableRowValue[],
  columns: Field[],
  ctx: TableValidationContext
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  // Validate required columns
  issues.push(...validateRequiredColumns(rows, columns, ctx));

  // Validate unique validation IDs
  issues.push(...validateUniqueness(rows, "validationId", "バリデーションID", ctx));

  // Check that error message is provided
  rows.forEach((row, rowIndex) => {
    const errorMessage = row.errorMessage;
    if (!errorMessage) {
      issues.push(
        createIssue({
          ...ctx,
          rowIndex,
          columnKey: "errorMessage",
          severity: "info",
          message: "エラーメッセージを定義することを推奨します",
        })
      );
    }
  });

  return issues;
}
