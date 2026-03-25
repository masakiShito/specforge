import type { ValidationWarning } from "../lib/document-editor/validate-document";
import type { ValidationItem } from "../types/validation";

/**
 * Enrich existing ValidationWarning[] with display-only data.
 * Does NOT change validation logic — only adds label, reason, fix, severity.
 */
export function enrichValidation(warnings: ValidationWarning[]): ValidationItem[] {
  return warnings.map((warning) => ({
    ...warning,
    severity: "error" as const,
    label: `必須項目が未入力です`,
    reason: `「${warning.fieldLabel}」は設計書に必須の情報です。この項目が未入力のままだと、ドキュメントとして不完全になります。`,
    fix: buildFix(warning),
  }));
}

function buildFix(warning: ValidationWarning): string {
  return `「${warning.sectionTitle}」セクションの「${warning.fieldLabel}」を入力してください。`;
}
