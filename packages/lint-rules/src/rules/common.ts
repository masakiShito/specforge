import type {
  TableRowValue,
  DesignValidationIssue,
  ValidationSeverity,
  TableValidationContext,
} from "../types";
import { isReferenceValue } from "../types";

/**
 * Get display value from a cell value (handles references)
 */
export function getDisplayValue(value: TableRowValue): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (isReferenceValue(value)) {
    return value.displayValue;
  }
  if (Array.isArray(value)) {
    return value.map(getDisplayValue).join(", ");
  }
  return String(value);
}

/**
 * Check if a cell value is empty
 */
export function isCellEmpty(value: TableRowValue): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === "string") {
    return value.trim() === "";
  }
  if (isReferenceValue(value)) {
    return value.displayValue.trim() === "";
  }
  if (Array.isArray(value)) {
    return value.length === 0 || value.every(isCellEmpty);
  }
  return false;
}

/**
 * Find duplicate keys in a table column
 */
export function findDuplicateKeys(
  rows: Record<string, TableRowValue>[],
  keyColumn: string
): { value: string; indices: number[] }[] {
  const valueMap = new Map<string, number[]>();

  rows.forEach((row, index) => {
    const cellValue = row[keyColumn];
    const displayValue = getDisplayValue(cellValue);
    if (displayValue) {
      const existing = valueMap.get(displayValue) || [];
      existing.push(index);
      valueMap.set(displayValue, existing);
    }
  });

  const duplicates: { value: string; indices: number[] }[] = [];
  valueMap.forEach((indices, value) => {
    if (indices.length > 1) {
      duplicates.push({ value, indices });
    }
  });

  return duplicates;
}

/**
 * Find empty rows in a table (all cells empty)
 */
export function findEmptyRows(
  rows: Record<string, TableRowValue>[],
  requiredColumns: string[]
): number[] {
  const emptyIndices: number[] = [];

  rows.forEach((row, index) => {
    const allEmpty = requiredColumns.every((col) => isCellEmpty(row[col]));
    if (allEmpty) {
      emptyIndices.push(index);
    }
  });

  return emptyIndices;
}

/**
 * Check if a row has required fields filled
 */
export function checkRequiredFields(
  row: Record<string, TableRowValue>,
  requiredColumns: string[],
  rowIndex: number
): { column: string; rowIndex: number }[] {
  const missingFields: { column: string; rowIndex: number }[] = [];

  requiredColumns.forEach((col) => {
    if (isCellEmpty(row[col])) {
      missingFields.push({ column: col, rowIndex });
    }
  });

  return missingFields;
}

/**
 * Create a validation issue
 */
export function createIssue(
  id: string,
  severity: ValidationSeverity,
  message: string,
  options: {
    documentId?: string;
    sectionKey?: string;
    fieldKey?: string;
    rowIndex?: number;
    cellKey?: string;
  } = {}
): DesignValidationIssue {
  return {
    id,
    severity,
    message,
    ...options,
  };
}

/**
 * Validate table for duplicate keys
 */
export function validateDuplicateKeys(
  context: TableValidationContext,
  keyColumn: string,
  itemLabel: string
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];
  const duplicates = findDuplicateKeys(context.rows, keyColumn);

  duplicates.forEach(({ value, indices }) => {
    issues.push(
      createIssue(
        `duplicate-${context.fieldKey}-${keyColumn}-${value}`,
        "error",
        `${itemLabel}「${value}」が重複しています（行: ${indices.map((i) => i + 1).join(", ")}）`,
        {
          documentId: context.documentId,
          sectionKey: context.sectionKey,
          fieldKey: context.fieldKey,
          rowIndex: indices[0],
          cellKey: keyColumn,
        }
      )
    );
  });

  return issues;
}

/**
 * Validate table for empty rows
 */
export function validateEmptyRows(
  context: TableValidationContext,
  requiredColumns: string[],
  tableLabel: string
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];
  const emptyRows = findEmptyRows(context.rows, requiredColumns);

  emptyRows.forEach((rowIndex) => {
    issues.push(
      createIssue(
        `empty-row-${context.fieldKey}-${rowIndex}`,
        "warning",
        `${tableLabel}の行${rowIndex + 1}が空です`,
        {
          documentId: context.documentId,
          sectionKey: context.sectionKey,
          fieldKey: context.fieldKey,
          rowIndex,
        }
      )
    );
  });

  return issues;
}

/**
 * Validate required fields in a table row
 */
export function validateRequiredTableFields(
  context: TableValidationContext,
  requiredColumns: { key: string; label: string }[]
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  context.rows.forEach((row, rowIndex) => {
    // Skip completely empty rows (handled by validateEmptyRows)
    const hasAnyValue = Object.values(row).some((v) => !isCellEmpty(v));
    if (!hasAnyValue) return;

    requiredColumns.forEach(({ key, label }) => {
      if (isCellEmpty(row[key])) {
        issues.push(
          createIssue(
            `required-${context.fieldKey}-${key}-${rowIndex}`,
            "error",
            `行${rowIndex + 1}の${label}は必須です`,
            {
              documentId: context.documentId,
              sectionKey: context.sectionKey,
              fieldKey: context.fieldKey,
              rowIndex,
              cellKey: key,
            }
          )
        );
      }
    });
  });

  return issues;
}
