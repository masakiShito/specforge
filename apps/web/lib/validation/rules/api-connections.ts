import type { Field } from "@specforge/document-schema";

import type { TableRowValue } from "../../document-editor/create-document-state";
import type { DesignValidationIssue, TableValidationContext } from "../types";
import {
  findDuplicateKeys,
  findEmptyRows,
  findMissingRequiredCells,
  getCellReferenceId,
  getCellString,
  isRowEmpty,
} from "./common";

/**
 * API Connections section – design quality rules.
 *
 * Rules:
 * - apiRef duplicate → error
 * - purpose empty → error (covered by required check)
 * - timing empty → error (covered by required check)
 * - apiRef not set → error (required reference)
 * - inputSummary and outputSummary both empty → warning
 * - empty rows → warning
 * - required cells missing → error
 */
export function validateApiConnections(
  rows: TableRowValue[],
  columns: Field[],
  ctx: TableValidationContext
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  // Common rules
  issues.push(...findEmptyRows(rows, columns, ctx));
  issues.push(...findMissingRequiredCells(rows, columns, ctx));

  // Check duplicate API references (by refId)
  const seenRefIds = new Map<string, number>();
  rows.forEach((row, rowIndex) => {
    if (isRowEmpty(row, columns)) return;

    const refId = getCellReferenceId(row, "apiRef");
    if (refId) {
      if (seenRefIds.has(refId)) {
        issues.push({
          id: `${ctx.sectionId}:${ctx.fieldId}:row${rowIndex}:apiRef:duplicate`,
          severity: "error",
          documentId: ctx.documentId,
          sectionId: ctx.sectionId,
          sectionTitle: ctx.sectionTitle,
          fieldId: ctx.fieldId,
          fieldLabel: ctx.fieldLabel,
          rowIndex,
          columnKey: "apiRef",
          message: `API参照が重複しています`,
          reason: `同じAPI仕様書への参照が行 ${seenRefIds.get(refId)! + 1} と重複しています。`,
          fix: `行 ${rowIndex + 1} のAPI参照を別のAPI仕様書に変更するか、重複する行を削除してください。`,
        });
      } else {
        seenRefIds.set(refId, rowIndex);
      }
    }
  });

  // Domain rules per row
  rows.forEach((row, rowIndex) => {
    if (isRowEmpty(row, columns)) return;

    const inputSummary = getCellString(row, "inputSummary");
    const outputSummary = getCellString(row, "outputSummary");

    // Both input and output summary empty → warning
    if (!inputSummary && !outputSummary) {
      issues.push({
        id: `${ctx.sectionId}:${ctx.fieldId}:row${rowIndex}:no-io-summary`,
        severity: "warning",
        documentId: ctx.documentId,
        sectionId: ctx.sectionId,
        sectionTitle: ctx.sectionTitle,
        fieldId: ctx.fieldId,
        fieldLabel: ctx.fieldLabel,
        rowIndex,
        columnKey: "inputSummary",
        message: `行 ${rowIndex + 1}: 主な入力・主な出力がどちらも未記載です`,
        reason: "APIの入出力が不明だと、実装者が画面とAPI間のデータフローを把握できません。",
        fix: "「主な入力」「主な出力」の少なくとも一方にデータの概要を記載してください。",
      });
    }
  });

  return issues;
}
