import type { DocumentEditorState, TableRowValue } from "../../document-editor/create-document-state";
import type { DesignValidationIssue } from "../types";

/**
 * API-spec specific validation rules for non-table fields.
 *
 * Rules:
 * - endpoint empty → error
 * - httpMethod empty → error
 * - response parameters table empty → warning
 * - error responses table empty → warning
 */
export function validateApiSpecFields(state: DocumentEditorState): DesignValidationIssue[] {
  if (state.document.kind !== "api-spec") return [];

  const issues: DesignValidationIssue[] = [];

  for (const section of state.document.sections) {
    for (const field of section.fields) {
      const value = state.fieldValues[field.id];

      // Endpoint Basic Info validation
      if (section.key === "endpoint-basic") {
        if (field.key === "endpoint" && (!value || (typeof value === "string" && !value.trim()))) {
          issues.push({
            id: `${section.id}:${field.id}:endpoint-empty`,
            severity: "error",
            sectionId: section.id,
            sectionTitle: section.title,
            fieldId: field.id,
            fieldLabel: field.label,
            message: "エンドポイントが未入力です",
            reason: "APIのエンドポイントは実装に必須の情報です。未入力のままだとAPI仕様書として成立しません。",
            fix: "「エンドポイント」にAPIのURLパス（例: /api/v1/orders）を入力してください。",
          });
        }
        if (field.key === "httpMethod" && (!value || (typeof value === "string" && !value.trim()))) {
          issues.push({
            id: `${section.id}:${field.id}:http-method-empty`,
            severity: "error",
            sectionId: section.id,
            sectionTitle: section.title,
            fieldId: field.id,
            fieldLabel: field.label,
            message: "HTTPメソッドが未選択です",
            reason: "HTTPメソッドはAPI定義の基本情報です。未選択だとリクエストの送信方法が不明になります。",
            fix: "「HTTPメソッド」で適切なメソッド（GET / POST / PUT / DELETE 等）を選択してください。",
          });
        }
      }

      // Table emptiness warnings for response and error sections
      if (field.valueType === "table") {
        const rows = Array.isArray(value) ? (value as TableRowValue[]) : [];
        if (section.key === "response-parameters" && rows.length === 0) {
          issues.push({
            id: `${section.id}:${field.id}:response-empty`,
            severity: "warning",
            sectionId: section.id,
            sectionTitle: section.title,
            fieldId: field.id,
            fieldLabel: field.label,
            message: "レスポンスパラメータが未定義です",
            reason: "レスポンスの定義がないと、API利用側が返却値を把握できません。",
            fix: "レスポンスパラメータテーブルに少なくとも1行追加してください。",
          });
        }
        if (section.key === "error-responses" && rows.length === 0) {
          issues.push({
            id: `${section.id}:${field.id}:errors-empty`,
            severity: "warning",
            sectionId: section.id,
            sectionTitle: section.title,
            fieldId: field.id,
            fieldLabel: field.label,
            message: "エラーレスポンスが未定義です",
            reason: "エラー定義がないと、エラー発生時の画面制御やリトライ判断ができません。",
            fix: "発生しうるエラーケースをエラーレスポンステーブルに追加してください。",
          });
        }
      }
    }
  }

  return issues;
}
