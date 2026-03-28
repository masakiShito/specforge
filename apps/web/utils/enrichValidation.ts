import type { ValidationWarning } from "../lib/document-editor/validate-document";
import type { DesignValidationIssue } from "../lib/validation/types";
import type { ValidationItem } from "../types/validation";

/**
 * Enrich existing ValidationWarning[] with display-only data.
 * Does NOT change validation logic — only adds label, reason, fix, severity.
 */
export function enrichValidation(warnings: ValidationWarning[]): ValidationItem[] {
  return warnings.map((warning) => {
    const isTableWarning = warning.id.includes(":table-empty") ||
      warning.id.includes(":row") ;

    if (isTableWarning) {
      return {
        ...warning,
        severity: "error" as const,
        label: warning.message,
        reason: `「${warning.fieldLabel}」テーブルに入力不備があります。`,
        fix: buildTableFix(warning),
      };
    }

    return {
      ...warning,
      severity: "error" as const,
      label: `必須項目が未入力です`,
      reason: `「${warning.fieldLabel}」は設計書に必須の情報です。この項目が未入力のままだと、ドキュメントとして不完全になります。`,
      fix: buildFix(warning),
    };
  });
}

/**
 * Convert DesignValidationIssue[] → ValidationItem[] for unified display.
 * These already contain severity, reason, and fix from the domain validators.
 */
export function convertDesignIssues(issues: DesignValidationIssue[]): ValidationItem[] {
  return issues.map((issue) => ({
    id: issue.id,
    documentId: issue.documentId,
    sectionId: issue.sectionId,
    sectionTitle: issue.sectionTitle,
    fieldId: issue.fieldId,
    fieldLabel: issue.fieldLabel,
    message: issue.message,
    rowIndex: issue.rowIndex,
    columnKey: issue.columnKey,
    cellKey: issue.rowIndex !== undefined && issue.columnKey
      ? `${issue.fieldId}:row${issue.rowIndex}:${issue.columnKey}`
      : undefined,
    severity: issue.severity,
    label: issue.message,
    reason: issue.reason,
    fix: issue.fix,
  }));
}

function buildFix(warning: ValidationWarning): string {
  return `「${warning.sectionTitle}」セクションの「${warning.fieldLabel}」を入力してください。`;
}

function buildTableFix(warning: ValidationWarning): string {
  if (warning.id.includes(":table-empty")) {
    return `「${warning.sectionTitle}」セクションの「${warning.fieldLabel}」テーブルに行を追加してください。`;
  }
  if (warning.id.includes(":empty")) {
    return `空行を削除するか、内容を入力してください。`;
  }
  return `該当セルに値を入力してください。`;
}
