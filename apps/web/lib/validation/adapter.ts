/**
 * Adapter layer to use @specforge/lint-rules in apps/web
 * This bridges the different interfaces between the two modules.
 */
import type { Field } from "@specforge/document-schema";
import {
  validateScreenFields as lintValidateScreenFields,
  validateEvents as lintValidateEvents,
  validateMessages as lintValidateMessages,
  validateApiConnections as lintValidateApiConnections,
  validateRequestParams as lintValidateRequestParams,
  validateResponseSchema as lintValidateResponseSchema,
  validateErrorResponses as lintValidateErrorResponses,
  validateApiSpecEndpoints as lintValidateApiSpecEndpoints,
  type DesignValidationIssue as LintValidationIssue,
  type TableValidationContext as LintTableContext,
  type TableRowValue as LintTableRowValue,
} from "@specforge/lint-rules";

import type { TableRowValue } from "../document-editor/create-document-state";
import type { DesignValidationIssue, TableValidationContext } from "./types";

/**
 * Convert lint-rules TableValidationContext to web app context
 */
function toLintContext(
  rows: TableRowValue[],
  columns: Field[],
  ctx: TableValidationContext
): LintTableContext {
  return {
    documentId: ctx.documentId,
    sectionKey: ctx.sectionId,
    fieldKey: ctx.fieldId,
    rows: rows as unknown as Record<string, LintTableRowValue>[],
    columns: columns.map((col) => ({
      key: col.key,
      label: col.label,
      type: col.valueType,
      required: col.required,
    })),
  };
}

/**
 * Convert lint-rules issue to web app issue format
 */
function toWebIssue(
  issue: LintValidationIssue,
  ctx: TableValidationContext
): DesignValidationIssue {
  return {
    id: issue.id,
    documentId: ctx.documentId,
    severity: issue.severity,
    sectionId: ctx.sectionId,
    sectionTitle: ctx.sectionTitle,
    fieldId: ctx.fieldId,
    fieldLabel: ctx.fieldLabel,
    rowIndex: issue.rowIndex,
    columnKey: issue.cellKey,
    message: issue.message,
    reason: issue.message,
    fix: getFixSuggestion(issue),
  };
}

/**
 * Generate fix suggestion based on issue
 */
function getFixSuggestion(issue: LintValidationIssue): string {
  if (issue.id.includes("duplicate")) {
    return "重複を削除するか、一意の値に変更してください";
  }
  if (issue.id.includes("required")) {
    return "必須項目を入力してください";
  }
  if (issue.id.includes("empty-row")) {
    return "空の行を削除するか、内容を入力してください";
  }
  if (issue.id.includes("invalid")) {
    return "有効な値を入力してください";
  }
  if (issue.id.includes("missing")) {
    return "不足している情報を追加してください";
  }
  return "該当箇所を確認してください";
}

/**
 * Adapter for screen fields validation
 */
export function validateScreenFields(
  rows: TableRowValue[],
  columns: Field[],
  ctx: TableValidationContext
): DesignValidationIssue[] {
  const lintCtx = toLintContext(rows, columns, ctx);
  const issues = lintValidateScreenFields(lintCtx);
  return issues.map((issue) => toWebIssue(issue, ctx));
}

/**
 * Adapter for events validation
 */
export function validateEvents(
  rows: TableRowValue[],
  columns: Field[],
  ctx: TableValidationContext
): DesignValidationIssue[] {
  const lintCtx = toLintContext(rows, columns, ctx);
  const issues = lintValidateEvents(lintCtx);
  return issues.map((issue) => toWebIssue(issue, ctx));
}

/**
 * Adapter for messages validation
 */
export function validateMessages(
  rows: TableRowValue[],
  columns: Field[],
  ctx: TableValidationContext
): DesignValidationIssue[] {
  const lintCtx = toLintContext(rows, columns, ctx);
  const issues = lintValidateMessages(lintCtx);
  return issues.map((issue) => toWebIssue(issue, ctx));
}

/**
 * Adapter for API connections validation
 */
export function validateApiConnections(
  rows: TableRowValue[],
  columns: Field[],
  ctx: TableValidationContext
): DesignValidationIssue[] {
  const lintCtx = toLintContext(rows, columns, ctx);
  const issues = lintValidateApiConnections(lintCtx);
  return issues.map((issue) => toWebIssue(issue, ctx));
}

/**
 * Adapter for request parameters validation
 */
export function validateRequestParameters(
  rows: TableRowValue[],
  columns: Field[],
  ctx: TableValidationContext
): DesignValidationIssue[] {
  const lintCtx = toLintContext(rows, columns, ctx);
  const issues = lintValidateRequestParams(lintCtx);
  return issues.map((issue) => toWebIssue(issue, ctx));
}

/**
 * Adapter for response parameters validation
 */
export function validateResponseParameters(
  rows: TableRowValue[],
  columns: Field[],
  ctx: TableValidationContext
): DesignValidationIssue[] {
  const lintCtx = toLintContext(rows, columns, ctx);
  const issues = lintValidateResponseSchema(lintCtx);
  return issues.map((issue) => toWebIssue(issue, ctx));
}

/**
 * Adapter for error responses validation
 */
export function validateErrorResponses(
  rows: TableRowValue[],
  columns: Field[],
  ctx: TableValidationContext
): DesignValidationIssue[] {
  const lintCtx = toLintContext(rows, columns, ctx);
  const issues = lintValidateErrorResponses(lintCtx);
  return issues.map((issue) => toWebIssue(issue, ctx));
}

/**
 * Adapter for API spec endpoints validation
 */
export function validateApiSpecEndpoints(
  rows: TableRowValue[],
  columns: Field[],
  ctx: TableValidationContext
): DesignValidationIssue[] {
  const lintCtx = toLintContext(rows, columns, ctx);
  const issues = lintValidateApiSpecEndpoints(lintCtx);
  return issues.map((issue) => toWebIssue(issue, ctx));
}
