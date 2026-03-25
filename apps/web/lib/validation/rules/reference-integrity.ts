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
  if (state.document.kind !== "screen-spec") return [];

  const issues: DesignValidationIssue[] = [];

  // Build lookup maps
  const documentById = new Map(project.documents.map((doc) => [doc.id, doc]));
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
          }
        }

        // 5. Duplicate api-spec title warning
        if (targetDocId && apiName && duplicateTitles.has(apiName)) {
          issues.push({
            id: `${section.id}:${field.id}:row${rowIndex}:ref-duplicate-name`,
            severity: "warning",
            sectionId: section.id,
            sectionTitle: section.title,
            fieldId: field.id,
            fieldLabel: field.label,
            rowIndex,
            columnKey: "apiName",
            message: `行 ${rowIndex + 1}: 同名のAPI仕様書がProject内に複数存在します`,
            reason: "同名のAPI仕様書が複数あると、どのAPIを指しているか不明確になります。",
            fix: "API仕様書のタイトルを一意にするか、「API参照」で正確な仕様書を選択してください。",
          });
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
