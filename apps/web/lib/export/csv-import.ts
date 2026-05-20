import type { Field } from "@specforge/document-schema";
import type { TableRowValue, TableRowCellValue } from "../document-editor/create-document-state";
import type { ImportResponse } from "./types";

interface CsvImportOptions {
  delimiter?: string;
  hasHeader?: boolean;
}

/**
 * Import table data from CSV string
 */
export function importTableFromCsv(
  csvString: string,
  columns: Field[],
  options: CsvImportOptions = {}
): ImportResponse<TableRowValue[]> {
  try {
    const delimiter = options.delimiter ?? detectDelimiter(csvString);
    const hasHeader = options.hasHeader !== false;

    const lines = parseCsvLines(csvString);

    if (lines.length === 0) {
      return { success: true, data: [] };
    }

    // Parse header if present
    let headerRow: string[] | null = null;
    let dataStartIndex = 0;

    if (hasHeader && lines.length > 0) {
      headerRow = parseCsvLine(lines[0], delimiter);
      dataStartIndex = 1;
    }

    // Map header to column keys
    const columnMapping = createColumnMapping(headerRow, columns);

    // Parse data rows
    const rows: TableRowValue[] = [];
    const errors: string[] = [];

    for (let i = dataStartIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cells = parseCsvLine(line, delimiter);
      const rowResult = parseRow(cells, columns, columnMapping);

      if (rowResult.errors.length > 0) {
        errors.push(`Row ${i + 1}: ${rowResult.errors.join(", ")}`);
      }

      rows.push(rowResult.row);
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: "CSV parsing completed with warnings",
        details: errors
      };
    }

    return { success: true, data: rows };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse CSV: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

function detectDelimiter(csvString: string): string {
  const firstLine = csvString.split(/[\r\n]/)[0] ?? "";

  // Count occurrences of common delimiters
  const commaCount = (firstLine.match(/,/g) ?? []).length;
  const tabCount = (firstLine.match(/\t/g) ?? []).length;
  const semicolonCount = (firstLine.match(/;/g) ?? []).length;

  if (tabCount > commaCount && tabCount > semicolonCount) {
    return "\t";
  }
  if (semicolonCount > commaCount) {
    return ";";
  }
  return ",";
}

function parseCsvLines(csvString: string): string[] {
  // Normalize line endings
  const normalized = csvString.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Split by lines, handling quoted fields that may contain newlines
  const lines: string[] = [];
  let currentLine = "";
  let inQuotes = false;

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];

    if (char === '"') {
      // Check if it's an escaped quote
      if (inQuotes && normalized[i + 1] === '"') {
        currentLine += '""';
        i++;
      } else {
        inQuotes = !inQuotes;
        currentLine += char;
      }
    } else if (char === "\n" && !inQuotes) {
      lines.push(currentLine);
      currentLine = "";
    } else {
      currentLine += char;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells;
}

interface ColumnMapping {
  columnIndex: number;
  column: Field;
}

function createColumnMapping(
  headerRow: string[] | null,
  columns: Field[]
): ColumnMapping[] {
  if (!headerRow) {
    // No header, assume columns are in order
    return columns.map((column, index) => ({ columnIndex: index, column }));
  }

  // Match header cells to column keys or labels
  return columns.map((column) => {
    let columnIndex = headerRow.findIndex(
      (h) => h.toLowerCase().trim() === column.key.toLowerCase()
    );

    if (columnIndex === -1) {
      columnIndex = headerRow.findIndex(
        (h) => h.toLowerCase().trim() === column.label.toLowerCase()
      );
    }

    return { columnIndex, column };
  });
}

function parseRow(
  cells: string[],
  columns: Field[],
  mapping: ColumnMapping[]
): { row: TableRowValue; errors: string[] } {
  const row: TableRowValue = {};
  const errors: string[] = [];

  for (const { columnIndex, column } of mapping) {
    if (columnIndex === -1) {
      // Column not found in CSV, skip
      continue;
    }

    const cellValue = cells[columnIndex]?.trim() ?? "";
    const parsed = parseCellValue(cellValue, column);

    if (parsed.error) {
      errors.push(`${column.label}: ${parsed.error}`);
    }

    row[column.key] = parsed.value;
  }

  return { row, errors };
}

function parseCellValue(
  cellValue: string,
  column: Field
): { value: TableRowCellValue; error?: string } {
  if (cellValue === "") {
    return { value: undefined };
  }

  switch (column.valueType) {
    case "boolean":
      return parseBooleanValue(cellValue);

    case "number":
      return parseNumberValue(cellValue);

    case "enum":
      return parseEnumValue(cellValue, column);

    default:
      return { value: cellValue };
  }
}

function parseBooleanValue(value: string): { value: boolean | undefined; error?: string } {
  const lower = value.toLowerCase();

  if (["true", "yes", "1", "○", "はい"].includes(lower)) {
    return { value: true };
  }

  if (["false", "no", "0", "-", "いいえ", ""].includes(lower)) {
    return { value: false };
  }

  return { value: undefined, error: `Invalid boolean value: ${value}` };
}

function parseNumberValue(value: string): { value: number | undefined; error?: string } {
  const num = Number(value);

  if (isNaN(num)) {
    return { value: undefined, error: `Invalid number: ${value}` };
  }

  return { value: num };
}

function parseEnumValue(
  value: string,
  column: Field
): { value: string | undefined; error?: string } {
  if (!column.options) {
    return { value };
  }

  // Try to match by value first
  const byValue = column.options.find((opt) => opt.value === value);
  if (byValue) {
    return { value: byValue.value };
  }

  // Try to match by label (case-insensitive)
  const lower = value.toLowerCase();
  const byLabel = column.options.find((opt) => opt.label.toLowerCase() === lower);
  if (byLabel) {
    return { value: byLabel.value };
  }

  return {
    value: undefined,
    error: `Invalid enum value: ${value}. Expected: ${column.options.map((o) => o.label).join(", ")}`
  };
}
