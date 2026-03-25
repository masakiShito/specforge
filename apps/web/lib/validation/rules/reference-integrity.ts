import type { Project } from "@specforge/document-schema";

import type { DocumentEditorState, TableRowValue } from "../../document-editor/create-document-state";
import type { DesignValidationIssue } from "../types";
import { getCellReferenceDocumentId, getCellString, isRowEmpty } from "./common";

const API_ACTION_KEYWORDS = ["api", "API", "通信", "呼出", "リクエスト", "fetch", "送信", "取得"];

export function validateReferenceIntegrity(state: DocumentEditorState, project: Project): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];
  const documentById = new Map(project.documents.map((doc) => [doc.id, doc]));

  if (state.document.kind !== "screen-spec") return [];

  const apiDocTitles = project.documents.filter((doc) => doc.kind === "api-spec").map((doc) => doc.title);

  const screenFieldKeys = new Set<string>();
  const eventNames = new Set<string>();

  const screenFieldsTable = state.document.sections.find((section) => section.key === "screen-fields")?.fields.find((field) => field.key === "screen-fields");
  const screenFieldRows = screenFieldsTable && Array.isArray(state.fieldValues[screenFieldsTable.id]) ? (state.fieldValues[screenFieldsTable.id] as TableRowValue[]) : [];
  screenFieldRows.forEach((row) => {
    const fieldKey = getCellString(row, "fieldKey");
    if (fieldKey) screenFieldKeys.add(fieldKey);
  });

  const duplicateTitles = new Set(apiDocTitles.filter((t, i) => apiDocTitles.indexOf(t) !== i));

  for (const section of state.document.sections) {
    if (section.key !== "api-connections") continue;

    for (const field of section.fields) {
      if (field.valueType !== "table" || !field.table) continue;
      const rows = Array.isArray(state.fieldValues[field.id]) ? (state.fieldValues[field.id] as TableRowValue[]) : [];

      rows.forEach((row, rowIndex) => {
        if (isRowEmpty(row, field.table!.columns)) return;

        const targetDocId = getCellReferenceDocumentId(row, "targetDocumentId");
        const apiName = getCellString(row, "apiName");

        if (!targetDocId && apiName) {
          issues.push({ id: `${section.id}:${field.id}:row${rowIndex}:ref-missing`, documentId: state.document.id, severity: "warning", sectionId: section.id, sectionTitle: section.title, fieldId: field.id, fieldLabel: field.label, rowIndex, columnKey: "targetDocumentId", message: `行 ${rowIndex + 1}: API名は入力されていますが、API参照が未設定です`, reason: "表示名だけでは参照関係を厳密に解決できません。Project内のapi-specをIDで関連付ける必要があります。", fix: "「API参照」列から対応するAPI仕様書を選択してください。" });
        }

        if (targetDocId) {
          const targetDoc = documentById.get(targetDocId);
          if (!targetDoc) {
            issues.push({ id: `${section.id}:${field.id}:row${rowIndex}:ref-not-found`, documentId: state.document.id, severity: "error", sectionId: section.id, sectionTitle: section.title, fieldId: field.id, fieldLabel: field.label, rowIndex, columnKey: "targetDocumentId", message: `行 ${rowIndex + 1}: 参照先のAPI仕様書が見つかりません`, reason: "参照先のドキュメントがProject内に存在しません。削除された可能性があります。", fix: "「API参照」から有効なAPI仕様書を再選択してください。" });
          } else if (targetDoc.kind !== "api-spec") {
            issues.push({ id: `${section.id}:${field.id}:row${rowIndex}:ref-wrong-kind`, documentId: state.document.id, severity: "error", sectionId: section.id, sectionTitle: section.title, fieldId: field.id, fieldLabel: field.label, rowIndex, columnKey: "targetDocumentId", message: `行 ${rowIndex + 1}: 参照先がAPI仕様書ではありません`, reason: `参照先「${targetDoc.title}」は ${targetDoc.kind} であり、api-spec ではありません。`, fix: "「API参照」からAPI仕様書のみを選択してください。" });
          }

          if (targetDoc && duplicateTitles.has(targetDoc.title)) {
            issues.push({ id: `${section.id}:${field.id}:row${rowIndex}:ref-duplicate-name`, documentId: state.document.id, severity: "warning", sectionId: section.id, sectionTitle: section.title, fieldId: field.id, fieldLabel: field.label, rowIndex, columnKey: "targetDocumentId", message: `行 ${rowIndex + 1}: 同名のAPI仕様書がProject内に複数存在します`, reason: "同名のAPI仕様書が複数あると、どのAPIを指しているか不明確になります。", fix: "API仕様書のタイトルを一意にするか、API名や備考で区別できる情報を追加してください。" });
          }
        }
      });
    }
  }

  for (const section of state.document.sections) {
    if (section.key !== "events") continue;

    for (const field of section.fields) {
      if (field.valueType !== "table" || !field.table) continue;
      const rows = Array.isArray(state.fieldValues[field.id]) ? (state.fieldValues[field.id] as TableRowValue[]) : [];
      const apiConnectionsField = state.document.sections.find((s) => s.key === "api-connections")?.fields.find((f) => f.key === "api-connections");
      const apiConnectionRows = apiConnectionsField && Array.isArray(state.fieldValues[apiConnectionsField.id]) ? (state.fieldValues[apiConnectionsField.id] as TableRowValue[]) : [];
      const hasAnyApiRef = apiConnectionRows.some((r) => getCellReferenceDocumentId(r, "targetDocumentId") !== "");

      rows.forEach((row, rowIndex) => {
        if (isRowEmpty(row, field.table!.columns)) return;
        const actionType = getCellString(row, "actionType");
        const eventName = getCellString(row, "eventName");
        const target = getCellString(row, "target");
        if (eventName) eventNames.add(eventName);
        const isApiAction = API_ACTION_KEYWORDS.some((kw) => actionType.toLowerCase().includes(kw.toLowerCase()));

        if (target && !isApiAction && !screenFieldKeys.has(target)) {
          issues.push({ id: `${section.id}:${field.id}:row${rowIndex}:event-target-field-not-found`, documentId: state.document.id, severity: "warning", sectionId: section.id, sectionTitle: section.title, fieldId: field.id, fieldLabel: field.label, rowIndex, columnKey: "target", message: `行 ${rowIndex + 1}: event の対象 field が見つかりません`, reason: `対象「${target}」に一致する screen field key が定義されていません。`, fix: "Screen Fields の項目キーを確認するか、Events の対象を修正してください。" });
        }

        if (isApiAction && !hasAnyApiRef && project.documents.some((d) => d.kind === "api-spec")) {
          issues.push({ id: `${section.id}:${field.id}:row${rowIndex}:api-action-no-ref`, documentId: state.document.id, severity: "warning", sectionId: section.id, sectionTitle: section.title, fieldId: field.id, fieldLabel: field.label, rowIndex, columnKey: "actionType", message: `行 ${rowIndex + 1}: API呼出の処理ですが、API Connectionsに参照が設定されていません`, reason: "API呼出系のイベントがあるのに、API Connectionsでapi-specへの参照が未設定です。", fix: "API Connectionsセクションで対応するapi-specを「API参照」列から選択してください。" });
        }
      });
    }
  }


  for (const section of state.document.sections) {
    if (section.key !== "messages") continue;
    for (const field of section.fields) {
      if (field.valueType !== "table" || !field.table) continue;
      const rows = Array.isArray(state.fieldValues[field.id]) ? (state.fieldValues[field.id] as TableRowValue[]) : [];
      rows.forEach((row, rowIndex) => {
        const condition = getCellString(row, "condition");
        if (!condition.startsWith("event:")) return;
        const eventName = condition.slice(6).trim();
        if (!eventName || eventNames.has(eventName)) return;
        issues.push({ id: `${section.id}:${field.id}:row${rowIndex}:message-event-not-found`, documentId: state.document.id, severity: "warning", sectionId: section.id, sectionTitle: section.title, fieldId: field.id, fieldLabel: field.label, rowIndex, columnKey: "condition", message: `行 ${rowIndex + 1}: message が参照する event が存在しません`, reason: `condition で参照された event「${eventName}」が Events セクションに未定義です。`, fix: "Events に対象 event を追加するか、condition の event 名を修正してください。" });
      });
    }
  }

  return issues;
}
