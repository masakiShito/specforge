import type { Field } from "@specforge/document-schema";

import type { TableRowValue } from "../../document-editor/create-document-state";
import type { DesignValidationIssue, TableValidationContext } from "../types";

// ---------------------------------------------------------------------------
// Primitive helpers
// ---------------------------------------------------------------------------

export function isCellEmpty(value: string | number | boolean | undefined): boolean {
  return value === undefined || value === null || value === "";
}

export function isRowEmpty(row: TableRowValue, columns: Field[]): boolean {
  return columns.every((col) => isCellEmpty(row[col.key]));
}

function cellStr(value: string | number | boolean | undefined): string {
  if (value === undefined || value === null) return "";
  return String(value);
}

// ---------------------------------------------------------------------------
// Reusable rule: duplicate key detection
// ---------------------------------------------------------------------------

export function findDuplicateKeys(
  rows: TableRowValue[],
  columnKey: string,
  columnLabel: string,
  ctx: TableValidationContext
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];
  const seen = new Map<string, number>(); // value → first rowIndex

  rows.forEach((row, rowIndex) => {
    const raw = cellStr(row[columnKey]).trim();
    if (!raw) return; // empty handled elsewhere

    if (seen.has(raw)) {
      issues.push({
        id: `${ctx.sectionId}:${ctx.fieldId}:row${rowIndex}:${columnKey}:duplicate`,
        severity: "error",
        sectionId: ctx.sectionId,
        sectionTitle: ctx.sectionTitle,
        fieldId: ctx.fieldId,
        fieldLabel: ctx.fieldLabel,
        rowIndex,
        columnKey,
        message: `${columnLabel}が重複しています`,
        reason: `同じセクション内で ${columnLabel} は一意である必要があります。行 ${seen.get(raw)! + 1} と重複しています。`,
        fix: `行 ${rowIndex + 1} の ${columnLabel}「${raw}」を一意な値に修正してください。`,
      });
    } else {
      seen.set(raw, rowIndex);
    }
  });

  return issues;
}

// ---------------------------------------------------------------------------
// Reusable rule: empty row detection
// ---------------------------------------------------------------------------

export function findEmptyRows(
  rows: TableRowValue[],
  columns: Field[],
  ctx: TableValidationContext
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  rows.forEach((row, rowIndex) => {
    if (isRowEmpty(row, columns)) {
      issues.push({
        id: `${ctx.sectionId}:${ctx.fieldId}:row${rowIndex}:all-empty`,
        severity: "warning",
        sectionId: ctx.sectionId,
        sectionTitle: ctx.sectionTitle,
        fieldId: ctx.fieldId,
        fieldLabel: ctx.fieldLabel,
        rowIndex,
        message: `行 ${rowIndex + 1} がすべて空です`,
        reason: "全セル空の行は設計書として意味がありません。入力途中か、削除忘れの可能性があります。",
        fix: "内容を入力するか、不要であれば行を削除してください。",
      });
    }
  });

  return issues;
}

// ---------------------------------------------------------------------------
// Reusable rule: required cell missing (already in validate-document, but
// here we return DesignValidationIssue so it integrates with new system)
// ---------------------------------------------------------------------------

export function findMissingRequiredCells(
  rows: TableRowValue[],
  columns: Field[],
  ctx: TableValidationContext
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  rows.forEach((row, rowIndex) => {
    // Skip fully empty rows — handled by findEmptyRows
    if (isRowEmpty(row, columns)) return;

    columns.forEach((col) => {
      if (!col.required) return;
      if (isCellEmpty(row[col.key])) {
        issues.push({
          id: `${ctx.sectionId}:${ctx.fieldId}:row${rowIndex}:${col.key}:required`,
          severity: "error",
          sectionId: ctx.sectionId,
          sectionTitle: ctx.sectionTitle,
          fieldId: ctx.fieldId,
          fieldLabel: ctx.fieldLabel,
          rowIndex,
          columnKey: col.key,
          message: `行 ${rowIndex + 1} の「${col.label}」が未入力です`,
          reason: `「${col.label}」は必須項目です。未入力のまま残すと設計書として不完全になります。`,
          fix: `行 ${rowIndex + 1} の「${col.label}」に値を入力してください。`,
        });
      }
    });
  });

  return issues;
}

// ---------------------------------------------------------------------------
// Helper: get string value from a cell
// ---------------------------------------------------------------------------

export function getCellString(row: TableRowValue, key: string): string {
  return cellStr(row[key]).trim();
}

export function getCellBoolean(row: TableRowValue, key: string): boolean | undefined {
  const v = row[key];
  if (typeof v === "boolean") return v;
  return undefined;
}
