import type { Project } from "@specforge/document-schema";

import type { DocumentEditorState, TableRowValue } from "../../document-editor/create-document-state";
import type { DesignValidationIssue } from "../types";
import { getCellString, isRowEmpty } from "./common";

/** Keywords that indicate an API call action type */
const API_ACTION_KEYWORDS = ["api", "API", "通信", "呼出", "リクエスト", "fetch", "送信", "取得"];

/**
 * Cross-document reference integrity validation.
 *
 * Checks:
 * 1. API Connections の targetDocumentId が存在するか
 * 2. 参照先 Document の kind が api-spec か
 * 3. Events で API呼出系なのに API参照が未設定
 * 4. Project 内で api-spec の title 重複がある場合 warning
 */
export function validateReferenceIntegrity(
  state: DocumentEditorState,
  project: Project
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];
  const documentById = new Map(project.documents.map((doc) => [doc.id, doc]));

  // api-spec specific project-level integrity checks
  if (state.document.kind === "api-spec") {
    const endpointSection = state.document.sections.find((section) => section.key === "endpoint-basic");
    const endpointField = endpointSection?.fields.find((field) => field.key === "endpoint");
    const methodField = endpointSection?.fields.find((field) => field.key === "httpMethod");

    const endpointValue = endpointField ? state.fieldValues[endpointField.id] : undefined;
    const methodValue = methodField ? state.fieldValues[methodField.id] : undefined;
    const endpoint = typeof endpointValue === "string" ? endpointValue.trim() : "";
    const method = typeof methodValue === "string" ? methodValue.trim() : "";

    if (endpoint && method) {
      const duplicate = project.documents.find((doc) => {
        if (doc.id === state.document.id || doc.kind !== "api-spec") return false;
        const docEndpoint = doc.sections
          .find((section) => section.key === "endpoint-basic")
          ?.fields.find((field) => field.key === "endpoint")
          ?.defaultValue;
        const docMethod = doc.sections
          .find((section) => section.key === "endpoint-basic")
          ?.fields.find((field) => field.key === "httpMethod")
          ?.defaultValue;
        return docEndpoint === endpoint && docMethod === method;
      });

      if (duplicate && endpointSection && endpointField) {
        issues.push({
          id: `${endpointSection.id}:${endpointField.id}:duplicate-endpoint-method`,
          severity: "warning",
          sectionId: endpointSection.id,
          sectionTitle: endpointSection.title,
          fieldId: endpointField.id,
          fieldLabel: endpointField.label,
          message: `${method} ${endpoint} は他のAPI仕様書（${duplicate.title}）と重複しています`,
          reason: "同一のメソッド・エンドポイント定義が複数あると、画面仕様書側でどちらを参照すべきか曖昧になります。",
          fix: "用途が異なる場合はパスやメソッドを見直すか、意図的な重複であることを備考に明記してください。",
        });
      }
    }

    return issues;
  }

  if (state.document.kind !== "screen-spec") return [];

  const apiDocTitles = project.documents
    .filter((doc) => doc.kind === "api-spec")
    .map((doc) => doc.title);
  const duplicateTitles = new Set(
    apiDocTitles.filter((t, i) => apiDocTitles.indexOf(t) !== i)
  );

  // Find API Connections section and table
  for (const section of state.document.sections) {
    if (section.key !== "api-connections") continue;

    for (const field of section.fields) {
      if (field.valueType !== "table" || !field.table) continue;

      const rows = Array.isArray(state.fieldValues[field.id])
        ? (state.fieldValues[field.id] as TableRowValue[])
        : [];

      rows.forEach((row, rowIndex) => {
        if (isRowEmpty(row, field.table!.columns)) return;

        const targetDocId = getCellString(row, "targetDocumentId");
        const apiName = getCellString(row, "apiName");

        if (!targetDocId && apiName) {
          issues.push({
            id: `${section.id}:${field.id}:row${rowIndex}:ref-missing`,
            severity: "warning",
            sectionId: section.id,
            sectionTitle: section.title,
            fieldId: field.id,
            fieldLabel: field.label,
            rowIndex,
            columnKey: "targetDocumentId",
            message: `行 ${rowIndex + 1}: API名は入力されていますが、API参照が未設定です`,
            reason: "表示名だけでは参照関係を厳密に解決できません。Project内のapi-specをIDで関連付ける必要があります。",
            fix: "「API参照」列から対応するAPI仕様書を選択してください。",
          });
        }

        // 1. targetDocumentId is set but document doesn't exist
        if (targetDocId) {
          const targetDoc = documentById.get(targetDocId);
          if (!targetDoc) {
            issues.push({
              id: `${section.id}:${field.id}:row${rowIndex}:ref-not-found`,
              severity: "error",
              sectionId: section.id,
              sectionTitle: section.title,
              fieldId: field.id,
              fieldLabel: field.label,
              rowIndex,
              columnKey: "targetDocumentId",
              message: `行 ${rowIndex + 1}: 参照先のAPI仕様書が見つかりません`,
              reason: "参照先のドキュメントがProject内に存在しません。削除された可能性があります。",
              fix: "「API参照」から有効なAPI仕様書を再選択してください。",
            });
          } else if (targetDoc.kind !== "api-spec") {
            // 2. Referenced document is not an api-spec
            issues.push({
              id: `${section.id}:${field.id}:row${rowIndex}:ref-wrong-kind`,
              severity: "error",
              sectionId: section.id,
              sectionTitle: section.title,
              fieldId: field.id,
              fieldLabel: field.label,
              rowIndex,
              columnKey: "targetDocumentId",
              message: `行 ${rowIndex + 1}: 参照先がAPI仕様書ではありません`,
              reason: `参照先「${targetDoc.title}」は ${targetDoc.kind} であり、api-spec ではありません。`,
              fix: "「API参照」からAPI仕様書のみを選択してください。",
            });
          } else {
            if (!apiName) {
              issues.push({
                id: `${section.id}:${field.id}:row${rowIndex}:name-empty`,
                severity: "info",
                sectionId: section.id,
                sectionTitle: section.title,
                fieldId: field.id,
                fieldLabel: field.label,
                rowIndex,
                columnKey: "apiName",
                message: `行 ${rowIndex + 1}: API参照は設定済みですがAPI名が未入力です`,
                reason: "一覧やレビュー時の可読性のため、API名（表示名）も入力されていると運用しやすくなります。",
                fix: `API名に「${targetDoc.title}」など識別しやすい表示名を記入してください。`,
              });
            } else if (apiName !== targetDoc.title) {
              issues.push({
                id: `${section.id}:${field.id}:row${rowIndex}:name-mismatch`,
                severity: "info",
                sectionId: section.id,
                sectionTitle: section.title,
                fieldId: field.id,
                fieldLabel: field.label,
                rowIndex,
                columnKey: "apiName",
                message: `行 ${rowIndex + 1}: API名と参照先タイトルが一致していません`,
                reason: `API名「${apiName}」と参照先ドキュメントタイトル「${targetDoc.title}」が異なるため、読み手に誤解を与える可能性があります。`,
                fix: "API名を参照先タイトルに合わせるか、意図的に別名を使う場合は備考に理由を追記してください。",
              });
            }
          }
        }

        // 5. Duplicate api-spec title warning
        if (targetDocId) {
          const targetDoc = documentById.get(targetDocId);
          if (targetDoc && duplicateTitles.has(targetDoc.title)) {
            issues.push({
              id: `${section.id}:${field.id}:row${rowIndex}:ref-duplicate-name`,
              severity: "warning",
              sectionId: section.id,
              sectionTitle: section.title,
              fieldId: field.id,
              fieldLabel: field.label,
              rowIndex,
              columnKey: "targetDocumentId",
              message: `行 ${rowIndex + 1}: 同名のAPI仕様書がProject内に複数存在します`,
              reason: "同名のAPI仕様書が複数あると、どのAPIを指しているか不明確になります。",
              fix: "API仕様書のタイトルを一意にするか、API名や備考で区別できる情報を追加してください。",
            });
          }
        }
      });
    }
  }

  // 3. Check Events section for API actions without reference
  for (const section of state.document.sections) {
    if (section.key !== "events") continue;

    for (const field of section.fields) {
      if (field.valueType !== "table" || !field.table) continue;

      const rows = Array.isArray(state.fieldValues[field.id])
        ? (state.fieldValues[field.id] as TableRowValue[])
        : [];

      // Get all targetDocumentIds from API Connections
      const apiConnectionsField = state.document.sections
        .find((s) => s.key === "api-connections")
        ?.fields.find((f) => f.key === "api-connections");
      const apiConnectionRows = apiConnectionsField
        ? (Array.isArray(state.fieldValues[apiConnectionsField.id])
            ? (state.fieldValues[apiConnectionsField.id] as TableRowValue[])
            : [])
        : [];
      const hasAnyApiRef = apiConnectionRows.some(
        (r) => getCellString(r, "targetDocumentId") !== ""
      );

      rows.forEach((row, rowIndex) => {
        if (isRowEmpty(row, field.table!.columns)) return;

        const actionType = getCellString(row, "actionType");
        const isApiAction = API_ACTION_KEYWORDS.some((kw) =>
          actionType.toLowerCase().includes(kw.toLowerCase())
        );

        if (isApiAction && !hasAnyApiRef && project.documents.some((d) => d.kind === "api-spec")) {
          issues.push({
            id: `${section.id}:${field.id}:row${rowIndex}:api-action-no-ref`,
            severity: "warning",
            sectionId: section.id,
            sectionTitle: section.title,
            fieldId: field.id,
            fieldLabel: field.label,
            rowIndex,
            columnKey: "actionType",
            message: `行 ${rowIndex + 1}: API呼出の処理ですが、API Connectionsに参照が設定されていません`,
            reason: "API呼出系のイベントがあるのに、API Connectionsでapi-specへの参照が未設定です。",
            fix: "API Connectionsセクションで対応するapi-specを「API参照」列から選択してください。",
          });
        }
      });
    }
  }

  return issues;
}
