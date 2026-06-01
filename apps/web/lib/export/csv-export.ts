import type { Field } from '@specforge/document-schema';
import type { TableRowValue, TableRowCellValue } from '../document-editor/create-document-state';
import type { ReferenceValue } from '../reference/model';
import type { CsvExportOptions, ExportResponse, TableExportData } from './types';

const DEFAULT_DELIMITER = ',';

/**
 * Export table data to CSV format
 */
export function exportTableToCsv(
  tableName: string,
  columns: Field[],
  rows: TableRowValue[],
  options: CsvExportOptions = {}
): ExportResponse<string> {
  try {
    const delimiter = options.delimiter ?? DEFAULT_DELIMITER;
    const includeHeader = options.includeHeader !== false;

    const lines: string[] = [];

    // Header row
    if (includeHeader) {
      const headerCells = columns.map((col) => escapeCsvCell(col.label, delimiter));
      lines.push(headerCells.join(delimiter));
    }

    // Data rows
    for (const row of rows) {
      const cells = columns.map((col) => {
        const cellValue = row[col.key];
        const formatted = formatCellValueForCsv(col, cellValue);
        return escapeCsvCell(formatted, delimiter);
      });
      lines.push(cells.join(delimiter));
    }

    return { success: true, data: lines.join('\n') };
  } catch (error) {
    return {
      success: false,
      error: `Failed to export to CSV: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Export multiple tables to a single CSV with separators
 */
export function exportMultipleTablesToCsv(
  tables: TableExportData[],
  options: CsvExportOptions = {}
): ExportResponse<string> {
  try {
    const delimiter = options.delimiter ?? DEFAULT_DELIMITER;
    const includeHeader = options.includeHeader !== false;

    const sections: string[] = [];

    for (const table of tables) {
      const lines: string[] = [];

      // Table name as section header
      lines.push(`# ${table.tableName}`);
      lines.push('');

      // Header row
      if (includeHeader) {
        const headerCells = table.columns.map((col) => escapeCsvCell(col.label, delimiter));
        lines.push(headerCells.join(delimiter));
      }

      // Data rows
      for (const row of table.rows) {
        const cells = table.columns.map((col) => {
          const cellValue = row[col.key];
          const formatted = String(cellValue ?? '');
          return escapeCsvCell(formatted, delimiter);
        });
        lines.push(cells.join(delimiter));
      }

      sections.push(lines.join('\n'));
    }

    return { success: true, data: sections.join('\n\n') };
  } catch (error) {
    return {
      success: false,
      error: `Failed to export tables to CSV: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function formatCellValueForCsv(column: Field, value: TableRowCellValue): string {
  if (value === undefined || value === null) {
    return '';
  }

  switch (column.valueType) {
    case 'boolean':
      return value ? 'true' : 'false';
    case 'enum':
      return getEnumLabel(column, value as string);
    case 'reference':
      return formatReferenceValueForCsv(value as ReferenceValue);
    default:
      return String(value);
  }
}

function getEnumLabel(field: Field, value: string): string {
  const option = field.options?.find((opt) => opt.value === value);
  return option?.label ?? value;
}

function formatReferenceValueForCsv(value: ReferenceValue): string {
  if (!value) {
    return '';
  }
  return value.refId ?? value.documentId ?? '';
}

function escapeCsvCell(text: string, delimiter: string): string {
  // Check if escaping is needed
  const needsQuoting =
    text.includes(delimiter) || text.includes('"') || text.includes('\n') || text.includes('\r');

  if (!needsQuoting) {
    return text;
  }

  // Escape double quotes by doubling them
  const escaped = text.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Generate filename for CSV export
 */
export function generateCsvFilename(tableName: string, documentTitle?: string): string {
  const sanitizedTable = tableName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const timestamp = new Date().toISOString().slice(0, 10);

  if (documentTitle) {
    const sanitizedDoc = documentTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${sanitizedDoc}_${sanitizedTable}_${timestamp}.csv`;
  }

  return `${sanitizedTable}_${timestamp}.csv`;
}
