import type {
  DesignValidationIssue,
  TableColumnDefinition,
  TableRowCellValue,
  TableRowValue,
  TableValidationContext,
  ValidationSeverity,
} from '../types';
import { isReferenceValue } from '../types';

type ColumnLike = TableColumnDefinition;
type ResolvedTableValidationContext = TableValidationContext & {
  documentId: string;
  sectionId: string;
  sectionTitle: string;
  fieldId: string;
  fieldLabel: string;
  tableKey: string;
};

export function isCellEmpty(value: TableRowCellValue): boolean {
  return value === undefined || value === null || value === '';
}

export function isRowEmpty(row: TableRowValue, columns: ColumnLike[]): boolean {
  return columns.every((col) => isCellEmpty(row[col.key]));
}

function cellStr(value: TableRowCellValue): string {
  if (value === undefined || value === null) return '';
  if (isReferenceValue(value)) {
    return value.refId ?? value.displayValue ?? '';
  }
  return String(value);
}

export function getDisplayValue(value: TableRowCellValue): string {
  if (Array.isArray(value)) return value.map(getDisplayValue).join(', ');
  return cellStr(value);
}

export function checkRequiredFields(
  row: TableRowValue,
  requiredColumns: string[],
  rowIndex: number
): { column: string; rowIndex: number }[] {
  return requiredColumns
    .filter((column) => isCellEmpty(row[column]))
    .map((column) => ({ column, rowIndex }));
}

function getSectionId(ctx: TableValidationContext): string {
  return ctx.sectionId ?? ctx.sectionKey ?? '';
}

function getFieldId(ctx: TableValidationContext): string {
  return ctx.fieldId ?? ctx.fieldKey ?? '';
}

function baseIssue(ctx: TableValidationContext) {
  const sectionId = getSectionId(ctx);
  const fieldId = getFieldId(ctx);
  return {
    documentId: ctx.documentId,
    sectionId,
    sectionTitle: ctx.sectionTitle ?? sectionId,
    fieldId,
    fieldLabel: ctx.fieldLabel ?? fieldId,
    sectionKey: ctx.sectionKey ?? sectionId,
    fieldKey: ctx.fieldKey ?? fieldId,
  };
}

export function findDuplicateKeys(
  rows: TableRowValue[],
  columnKey: string
): { value: string; indices: number[] }[];
export function findDuplicateKeys(
  rows: TableRowValue[],
  columnKey: string,
  columnLabel: string,
  ctx: TableValidationContext
): DesignValidationIssue[];
export function findDuplicateKeys(
  rows: TableRowValue[],
  columnKey: string,
  columnLabel?: string,
  ctx?: TableValidationContext
): DesignValidationIssue[] | { value: string; indices: number[] }[] {
  if (!ctx) {
    const valueMap = new Map<string, number[]>();
    rows.forEach((row, index) => {
      const value = cellStr(row[columnKey]);
      if (!value) return;
      valueMap.set(value, [...(valueMap.get(value) ?? []), index]);
    });
    return Array.from(valueMap.entries())
      .filter(([, indices]) => indices.length > 1)
      .map(([value, indices]) => ({ value, indices }));
  }

  const issues: DesignValidationIssue[] = [];
  const sectionId = getSectionId(ctx);
  const fieldId = getFieldId(ctx);
  const seen = new Map<string, number>();
  rows.forEach((row, rowIndex) => {
    const raw = cellStr(row[columnKey]).trim();
    if (!raw) return;
    if (seen.has(raw)) {
      issues.push({
        id: `${sectionId}:${fieldId}:row${rowIndex}:${columnKey}:duplicate`,
        severity: 'error',
        ...baseIssue(ctx),
        rowIndex,
        columnKey,
        cellKey: columnKey,
        message: `${columnLabel ?? columnKey}が重複しています`,
        reason: `同じセクション内で ${columnLabel ?? columnKey} は一意である必要があります。行 ${seen.get(raw)! + 1} と重複しています。`,
        fix: `行 ${rowIndex + 1} の ${columnLabel ?? columnKey}「${raw}」を一意な値に修正してください。`,
      });
    } else {
      seen.set(raw, rowIndex);
    }
  });
  return issues;
}

export function findEmptyRows(rows: TableRowValue[], requiredColumns: string[]): number[];
export function findEmptyRows(
  rows: TableRowValue[],
  columns: ColumnLike[],
  ctx: TableValidationContext
): DesignValidationIssue[];
export function findEmptyRows(
  rows: TableRowValue[],
  columns: ColumnLike[] | string[],
  ctx?: TableValidationContext
): DesignValidationIssue[] | number[] {
  if (!ctx) {
    return rows.flatMap((row, index) => {
      const isEmpty = (columns as string[]).every((column) => isCellEmpty(row[column]));
      return isEmpty ? [index] : [];
    });
  }

  const issues: DesignValidationIssue[] = [];
  const sectionId = getSectionId(ctx);
  const fieldId = getFieldId(ctx);
  rows.forEach((row, rowIndex) => {
    if (isRowEmpty(row, columns as ColumnLike[])) {
      issues.push({
        id: `${sectionId}:${fieldId}:row${rowIndex}:all-empty`,
        severity: 'warning',
        ...baseIssue(ctx),
        rowIndex,
        message: `行 ${rowIndex + 1} がすべて空です`,
        reason:
          '全セル空の行は設計書として意味がありません。入力途中か、削除忘れの可能性があります。',
        fix: '内容を入力するか、不要であれば行を削除してください。',
      });
    }
  });
  return issues;
}

export function findMissingRequiredCells(
  rows: TableRowValue[],
  columns: ColumnLike[],
  ctx: TableValidationContext
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];
  const sectionId = getSectionId(ctx);
  const fieldId = getFieldId(ctx);
  rows.forEach((row, rowIndex) => {
    if (isRowEmpty(row, columns)) return;
    columns.forEach((col) => {
      if (!col.required) return;
      if (isCellEmpty(row[col.key])) {
        issues.push({
          id: `${sectionId}:${fieldId}:row${rowIndex}:${col.key}:required`,
          severity: 'error',
          ...baseIssue(ctx),
          rowIndex,
          columnKey: col.key,
          cellKey: col.key,
          message: `行 ${rowIndex + 1} の「${col.label}」が未入力です`,
          reason: `「${col.label}」は必須項目です。未入力のまま残すと設計書として不完全になります。`,
          fix: `行 ${rowIndex + 1} の「${col.label}」に値を入力してください。`,
        });
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
  if (!isReferenceValue(value)) return '';
  return value.refId ?? value.targetKey ?? '';
}

export function getCellReferenceDocumentId(row: TableRowValue, key: string): string {
  const value = row[key];
  if (!isReferenceValue(value)) return '';
  return value.documentId ?? value.targetDocumentId ?? '';
}

export function getCellBoolean(row: TableRowValue, key: string): boolean | undefined {
  const v = row[key];
  return typeof v === 'boolean' ? v : undefined;
}

/**
 * Create a standardized validation issue
 */
type CreateIssueParams = {
  documentId: string;
  sectionId: string;
  sectionTitle: string;
  fieldId: string;
  fieldLabel: string;
  rowIndex: number;
  columnKey: string;
  severity: ValidationSeverity;
  message: string;
  reason?: string;
  fix?: string;
};

export function createIssue(params: CreateIssueParams): DesignValidationIssue;
export function createIssue(
  id: string,
  severity: ValidationSeverity,
  message: string,
  options?: {
    documentId?: string;
    sectionKey?: string;
    fieldKey?: string;
    rowIndex?: number;
    cellKey?: string;
  }
): DesignValidationIssue;
export function createIssue(
  paramsOrId: CreateIssueParams | string,
  severity?: ValidationSeverity,
  message?: string,
  options: {
    documentId?: string;
    sectionKey?: string;
    fieldKey?: string;
    rowIndex?: number;
    cellKey?: string;
  } = {}
): DesignValidationIssue {
  if (typeof paramsOrId === 'string') {
    const sectionId = options.sectionKey ?? '';
    const fieldId = options.fieldKey ?? '';
    return {
      id: paramsOrId,
      documentId: options.documentId ?? '',
      sectionId,
      sectionTitle: sectionId,
      fieldId,
      fieldLabel: fieldId,
      rowIndex: options.rowIndex,
      columnKey: options.cellKey,
      cellKey: options.cellKey,
      severity: severity ?? 'warning',
      message: message ?? '',
      reason: message ?? '',
      fix: '該当箇所を確認してください',
      sectionKey: sectionId,
      fieldKey: fieldId,
    };
  }

  const params = paramsOrId;
  const sectionId = params.sectionId;
  const fieldId = params.fieldId;
  return {
    id: `${sectionId}:${fieldId}:row${params.rowIndex}:${params.columnKey}:custom`,
    documentId: params.documentId,
    sectionId,
    sectionTitle: params.sectionTitle,
    fieldId,
    fieldLabel: params.fieldLabel,
    rowIndex: params.rowIndex,
    columnKey: params.columnKey,
    cellKey: params.columnKey,
    severity: params.severity,
    message: params.message,
    reason: params.reason ?? params.message,
    fix: params.fix ?? '該当箇所を確認してください',
    sectionKey: sectionId,
    fieldKey: fieldId,
  };
}

/**
 * Validate uniqueness of a column value across all rows
 */
export function validateUniqueness(
  rows: TableRowValue[],
  columnKey: string,
  columnLabel: string,
  ctx: TableValidationContext
): DesignValidationIssue[] {
  return findDuplicateKeys(rows, columnKey, columnLabel, ctx) as DesignValidationIssue[];
}

/**
 * Validate that required columns are filled in non-empty rows
 */
export function validateRequiredColumns(
  rows: TableRowValue[],
  columns: ColumnLike[],
  ctx: TableValidationContext
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  // Check for empty rows
  issues.push(...(findEmptyRows(rows, columns, ctx) as DesignValidationIssue[]));

  // Check for missing required cells
  issues.push(...findMissingRequiredCells(rows, columns, ctx));

  return issues;
}

export function validateDuplicateKeys(
  context: TableValidationContext,
  keyColumn: string,
  itemLabel: string
): DesignValidationIssue[] {
  return findDuplicateKeys(context.rows ?? [], keyColumn, itemLabel, context);
}

export function validateEmptyRows(
  context: TableValidationContext,
  requiredColumns: string[],
  tableLabel: string
): DesignValidationIssue[] {
  const columns = requiredColumns.map((key) => ({ key, label: key, required: false }));
  return findEmptyRows(context.rows ?? [], columns, context).map((issue) => ({
    ...issue,
    message: `${tableLabel}の行${(issue.rowIndex ?? 0) + 1}が空です`,
  }));
}

export function validateRequiredTableFields(
  context: TableValidationContext,
  requiredColumns: { key: string; label: string }[]
): DesignValidationIssue[] {
  const columns = requiredColumns.map((column) => ({ ...column, required: true }));
  return findMissingRequiredCells(context.rows ?? [], columns, context);
}

export function normalizeTableValidationArgs(
  rowsOrContext: TableRowValue[] | TableValidationContext,
  columns?: ColumnLike[],
  ctx?: TableValidationContext
): { rows: TableRowValue[]; columns: ColumnLike[]; ctx: ResolvedTableValidationContext } {
  if (Array.isArray(rowsOrContext)) {
    const resolved = resolveContext(ctx);
    return {
      rows: rowsOrContext,
      columns: columns ?? [],
      ctx: resolved,
    };
  }

  const resolved = resolveContext(rowsOrContext);
  return {
    rows: rowsOrContext.rows ?? [],
    columns: rowsOrContext.columns ?? [],
    ctx: resolved,
  };
}

function resolveContext(ctx?: TableValidationContext): ResolvedTableValidationContext {
  const sectionId = ctx?.sectionId ?? ctx?.sectionKey ?? '';
  const fieldId = ctx?.fieldId ?? ctx?.fieldKey ?? '';
  return {
    documentId: ctx?.documentId ?? '',
    sectionId,
    sectionTitle: ctx?.sectionTitle ?? sectionId,
    fieldId,
    fieldLabel: ctx?.fieldLabel ?? fieldId,
    tableKey: ctx?.tableKey ?? fieldId,
    sectionKey: ctx?.sectionKey ?? sectionId,
    fieldKey: ctx?.fieldKey ?? fieldId,
    rows: ctx?.rows,
    columns: ctx?.columns,
  };
}
