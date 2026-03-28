import type { Field } from "@specforge/document-schema";

import type { TableRowValue } from "../../document-editor/create-document-state";
import type { DesignValidationIssue, TableValidationContext } from "../types";
import {
  findDuplicateKeys,
  findEmptyRows,
  findMissingRequiredCells,
  getCellString,
  isRowEmpty,
} from "./common";

/** API call related keywords in actionType */
const API_ACTION_KEYWORDS = ["api", "API", "通信", "呼出", "リクエスト", "fetch", "送信", "取得"];

/**
 * Events section – design quality rules.
 *
 * Rules:
 * - eventName duplicate → error
 * - actionType contains API keywords but target is empty → error
 * - triggerType=onChange but target (対象) is empty → warning
 * - target is free text only (no structured reference) → info
 * - empty rows → warning
 * - required cells missing → error
 */
export function validateEvents(
  rows: TableRowValue[],
  columns: Field[],
  ctx: TableValidationContext
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  // Common rules
  issues.push(...findEmptyRows(rows, columns, ctx));
  issues.push(...findMissingRequiredCells(rows, columns, ctx));
  issues.push(...findDuplicateKeys(rows, "eventName", "イベント名", ctx));

  // Domain rules per row
  rows.forEach((row, rowIndex) => {
    if (isRowEmpty(row, columns)) return;

    const actionType = getCellString(row, "actionType");
    const triggerType = getCellString(row, "triggerType");
    const target = getCellString(row, "target");

    // API action without target → error
    const isApiAction = API_ACTION_KEYWORDS.some((kw) =>
      actionType.toLowerCase().includes(kw.toLowerCase())
    );
    if (isApiAction && !target) {
      issues.push({
        id: `${ctx.sectionId}:${ctx.fieldId}:row${rowIndex}:api-no-target`,
        severity: "error",
        documentId: ctx.documentId,
        sectionId: ctx.sectionId,
        sectionTitle: ctx.sectionTitle,
        fieldId: ctx.fieldId,
        fieldLabel: ctx.fieldLabel,
        rowIndex,
        columnKey: "target",
        message: `行 ${rowIndex + 1}: API呼出の処理なのに対象が未指定です`,
        reason: "API呼出系の処理では、呼び出すAPIやエンドポイントを対象に記載しないと実装時に情報が不足します。",
        fix: "「対象」に呼び出すAPI名またはエンドポイントを記載してください。",
      });
    }

    // onChange without target → warning
    if (triggerType === "onChange" && !target) {
      issues.push({
        id: `${ctx.sectionId}:${ctx.fieldId}:row${rowIndex}:onchange-no-target`,
        severity: "warning",
        documentId: ctx.documentId,
        sectionId: ctx.sectionId,
        sectionTitle: ctx.sectionTitle,
        fieldId: ctx.fieldId,
        fieldLabel: ctx.fieldLabel,
        rowIndex,
        columnKey: "target",
        message: `行 ${rowIndex + 1}: onChange イベントなのに対象が未指定です`,
        reason: "onChange は特定の入力項目に紐づくイベントです。対象が不明だと、どの項目の変更時に発火するか分かりません。",
        fix: "「対象」にどの画面項目の変更がトリガーになるかを記載してください。",
      });
    }
  });

  return issues;
}
