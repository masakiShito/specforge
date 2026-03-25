import type { Field } from "@specforge/document-schema";

import type { TableRowValue } from "../../document-editor/create-document-state";
import type { DesignValidationIssue, TableValidationContext } from "../types";
import {
  findDuplicateKeys,
  findEmptyRows,
  findMissingRequiredCells,
  getCellString,
  getCellBoolean,
  isRowEmpty,
} from "./common";

/**
 * Screen Fields section – design quality rules.
 *
 * Rules:
 * - fieldKey duplicate → error
 * - name empty but fieldKey exists → error
 * - inputType=label + editable=true → warning
 * - inputType=button + required=true → warning
 * - visibleCondition too long (>120) → info
 * - empty rows → warning
 * - required cells missing → error
 */
export function validateScreenFields(
  rows: TableRowValue[],
  columns: Field[],
  ctx: TableValidationContext
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  // Common rules
  issues.push(...findEmptyRows(rows, columns, ctx));
  issues.push(...findMissingRequiredCells(rows, columns, ctx));
  issues.push(...findDuplicateKeys(rows, "fieldKey", "項目キー", ctx));

  // Domain rules per row
  rows.forEach((row, rowIndex) => {
    if (isRowEmpty(row, columns)) return;

    const name = getCellString(row, "name");
    const fieldKey = getCellString(row, "fieldKey");
    const inputType = getCellString(row, "inputType");
    const required = getCellBoolean(row, "required");
    const editable = getCellBoolean(row, "editable");
    const visibleCondition = getCellString(row, "visibleCondition");

    // name empty but fieldKey exists
    if (!name && fieldKey) {
      issues.push({
        id: `${ctx.sectionId}:${ctx.fieldId}:row${rowIndex}:name:missing-with-key`,
        severity: "error",
        sectionId: ctx.sectionId,
        sectionTitle: ctx.sectionTitle,
        fieldId: ctx.fieldId,
        fieldLabel: ctx.fieldLabel,
        rowIndex,
        columnKey: "name",
        message: `行 ${rowIndex + 1}: 項目名が空で項目キーのみ入力されています`,
        reason: "項目名がないと、設計書を読む人がその項目の用途を理解できません。",
        fix: `行 ${rowIndex + 1} の「項目名」にユーザーに見える表示名を入力してください。`,
      });
    }

    // inputType=label + editable=true → warning
    if (inputType === "label" && editable === true) {
      issues.push({
        id: `${ctx.sectionId}:${ctx.fieldId}:row${rowIndex}:label-editable`,
        severity: "warning",
        sectionId: ctx.sectionId,
        sectionTitle: ctx.sectionTitle,
        fieldId: ctx.fieldId,
        fieldLabel: ctx.fieldLabel,
        rowIndex,
        columnKey: "editable",
        message: `行 ${rowIndex + 1}: ラベル項目に「編集可」が設定されています`,
        reason: "inputType が label の場合、ユーザーが編集することはできません。editable=true は矛盾した設計です。",
        fix: "「編集可」を「いいえ」に変更するか、inputType を text 等の入力可能な型に変更してください。",
      });
    }

    // inputType=button + required=true → warning
    if (inputType === "button" && required === true) {
      issues.push({
        id: `${ctx.sectionId}:${ctx.fieldId}:row${rowIndex}:button-required`,
        severity: "warning",
        sectionId: ctx.sectionId,
        sectionTitle: ctx.sectionTitle,
        fieldId: ctx.fieldId,
        fieldLabel: ctx.fieldLabel,
        rowIndex,
        columnKey: "required",
        message: `行 ${rowIndex + 1}: ボタン項目に「必須」が設定されています`,
        reason: "ボタンはユーザーが「入力」する項目ではないため、必須の概念は通常適用されません。",
        fix: "「必須」を「いいえ」に変更するか、意図を備考欄に記載してください。",
      });
    }

    // visibleCondition too long → info
    if (visibleCondition.length > 120) {
      issues.push({
        id: `${ctx.sectionId}:${ctx.fieldId}:row${rowIndex}:visible-condition-long`,
        severity: "info",
        sectionId: ctx.sectionId,
        sectionTitle: ctx.sectionTitle,
        fieldId: ctx.fieldId,
        fieldLabel: ctx.fieldLabel,
        rowIndex,
        columnKey: "visibleCondition",
        message: `行 ${rowIndex + 1}: 表示条件が長すぎる可能性があります`,
        reason: "表示条件が複雑すぎると実装時の認識齟齬が生じやすくなります。条件をシンプルに保つか、分割を検討してください。",
        fix: "条件が複雑な場合は、備考欄で補足するか、条件を分割して記述してください。",
      });
    }
  });

  return issues;
}
