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

/**
 * API Connections section – design quality rules.
 *
 * Rules:
 * - apiName duplicate → error
 * - purpose empty → error (covered by required check)
 * - timing empty → error (covered by required check)
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
  issues.push(...findDuplicateKeys(rows, "apiName", "API名", ctx));

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
