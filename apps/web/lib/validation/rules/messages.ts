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

/** Keywords typically found in confirm-style messages */
const CONFIRM_KEYWORDS = ["よろしいですか", "確認", "実行しますか", "削除しますか", "送信しますか", "保存しますか", "OK"];

/**
 * Messages section – design quality rules.
 *
 * Rules:
 * - messageId duplicate → error
 * - messageText empty → error (covered by required check)
 * - messageType=confirm but text doesn't look like a confirmation → info
 * - error messages without condition → warning (if many)
 * - empty rows → warning
 * - required cells missing → error
 */
export function validateMessages(
  rows: TableRowValue[],
  columns: Field[],
  ctx: TableValidationContext
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  // Common rules
  issues.push(...findEmptyRows(rows, columns, ctx));
  issues.push(...findMissingRequiredCells(rows, columns, ctx));
  issues.push(...findDuplicateKeys(rows, "messageId", "メッセージID", ctx));

  // Count error messages without condition for batch warning
  let errorMsgsWithoutCondition = 0;

  // Domain rules per row
  rows.forEach((row, rowIndex) => {
    if (isRowEmpty(row, columns)) return;

    const messageType = getCellString(row, "messageType");
    const messageText = getCellString(row, "messageText");
    const condition = getCellString(row, "condition");

    // confirm type without confirm-like text → info
    if (messageType === "confirm" && messageText) {
      const looksLikeConfirm = CONFIRM_KEYWORDS.some((kw) =>
        messageText.includes(kw)
      );
      if (!looksLikeConfirm) {
        issues.push({
          id: `${ctx.sectionId}:${ctx.fieldId}:row${rowIndex}:confirm-text-mismatch`,
          severity: "info",
          documentId: ctx.documentId,
          sectionId: ctx.sectionId,
          sectionTitle: ctx.sectionTitle,
          fieldId: ctx.fieldId,
          fieldLabel: ctx.fieldLabel,
          rowIndex,
          columnKey: "messageText",
          message: `行 ${rowIndex + 1}: confirm メッセージに確認文言が見当たりません`,
          reason: "confirm タイプのメッセージは、ユーザーに確認を促す文言（例：「よろしいですか？」）を含むのが一般的です。",
          fix: "文言が確認を求める内容か確認してください。意図的であれば問題ありません。",
        });
      }
    }

    // Track error messages without condition
    if (messageType === "error" && !condition) {
      errorMsgsWithoutCondition++;
    }
  });

  // Many error messages without condition → warning
  if (errorMsgsWithoutCondition >= 3) {
    issues.push({
      id: `${ctx.sectionId}:${ctx.fieldId}:error-msgs-no-condition`,
      severity: "warning",
      documentId: ctx.documentId,
      sectionId: ctx.sectionId,
      sectionTitle: ctx.sectionTitle,
      fieldId: ctx.fieldId,
      fieldLabel: ctx.fieldLabel,
      message: `表示条件が未設定の error メッセージが ${errorMsgsWithoutCondition} 件あります`,
      reason: "error メッセージは特定の条件下で表示されるのが一般的です。表示条件がないと、いつ表示されるか実装者が判断できません。",
      fix: "各 error メッセージの「表示条件」欄に、エラーが発生する条件を記載してください。",
    });
  }

  return issues;
}
