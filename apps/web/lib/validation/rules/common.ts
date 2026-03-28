import type { Field } from "@specforge/document-schema";

import type { TableRowValue } from "../../document-editor/create-document-state";
import { isReferenceValue } from "../../reference/model";
import type { DesignValidationIssue, TableValidationContext } from "../types";

export function isCellEmpty(value: TableRowValue[string]): boolean {
  return value === undefined || value === null || value === "";
}

export function isRowEmpty(row: TableRowValue, columns: Field[]): boolean {
  return columns.every((col) => isCellEmpty(row[col.key]));
}

function cellStr(value: TableRowValue[string]): string {
  if (value === undefined || value === null) return "";
  if (isReferenceValue(value)) return value.refId;
  return String(value);
}

function baseIssue(ctx: TableValidationContext) {
  return {
    documentId: ctx.documentId,
    sectionId: ctx.sectionId,
    sectionTitle: ctx.sectionTitle,
    fieldId: ctx.fieldId,
    fieldLabel: ctx.fieldLabel,
  };
}

export function findDuplicateKeys(rows: TableRowValue[], columnKey: string, columnLabel: string, ctx: TableValidationContext): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];
  const seen = new Map<string, number>();
  rows.forEach((row, rowIndex) => {
    const raw = cellStr(row[columnKey]).trim();
    if (!raw) return;
    if (seen.has(raw)) {
      issues.push({ id: `${ctx.sectionId}:${ctx.fieldId}:row${rowIndex}:${columnKey}:duplicate`, severity: "error", ...baseIssue(ctx), rowIndex, columnKey, message: `${columnLabel}が重複しています`, reason: `同じセクション内で ${columnLabel} は一意である必要があります。行 ${seen.get(raw)! + 1} と重複しています。`, fix: `行 ${rowIndex + 1} の ${columnLabel}「${raw}」を一意な値に修正してください。` });
    } else {
      seen.set(raw, rowIndex);
    }
  });
  return issues;
}

export function findEmptyRows(rows: TableRowValue[], columns: Field[], ctx: TableValidationContext): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];
  rows.forEach((row, rowIndex) => {
    if (isRowEmpty(row, columns)) {
      issues.push({ id: `${ctx.sectionId}:${ctx.fieldId}:row${rowIndex}:all-empty`, severity: "warning", ...baseIssue(ctx), rowIndex, message: `行 ${rowIndex + 1} がすべて空です`, reason: "全セル空の行は設計書として意味がありません。入力途中か、削除忘れの可能性があります。", fix: "内容を入力するか、不要であれば行を削除してください。" });
    }
  });
  return issues;
}

export function findMissingRequiredCells(rows: TableRowValue[], columns: Field[], ctx: TableValidationContext): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];
  rows.forEach((row, rowIndex) => {
    if (isRowEmpty(row, columns)) return;
    columns.forEach((col) => {
      if (!col.required) return;
      if (isCellEmpty(row[col.key])) {
        issues.push({ id: `${ctx.sectionId}:${ctx.fieldId}:row${rowIndex}:${col.key}:required`, severity: "error", ...baseIssue(ctx), rowIndex, columnKey: col.key, message: `行 ${rowIndex + 1} の「${col.label}」が未入力です`, reason: `「${col.label}」は必須項目です。未入力のまま残すと設計書として不完全になります。`, fix: `行 ${rowIndex + 1} の「${col.label}」に値を入力してください。` });
      }
    });
  });
  return issues;
}

export function getCellString(row: TableRowValue, key: string): string {
  return cellStr(row[key]).trim();
}

export function getCellReferenceId(row: TableRowValue, key: string): string {
  const value = row[key];
  if (!isReferenceValue(value)) return "";
  return value.refId;
}

export function getCellReferenceDocumentId(row: TableRowValue, key: string): string {
  const value = row[key];
  if (!isReferenceValue(value)) return "";
  return value.documentId;
}

export function getCellBoolean(row: TableRowValue, key: string): boolean | undefined {
  const v = row[key];
  return typeof v === "boolean" ? v : undefined;
}
