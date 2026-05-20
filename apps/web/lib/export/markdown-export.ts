import type { Document, Section, Field } from "@specforge/document-schema";
import type { FieldValue, TableRowValue, TableRowCellValue } from "../document-editor/create-document-state";
import type { ReferenceValue } from "../reference/model";
import type { ExportResponse } from "./types";

/**
 * Export document to Markdown format
 */
export function exportDocumentToMarkdown(
  document: Document,
  fieldValues: Record<string, FieldValue>
): ExportResponse<string> {
  try {
    const lines: string[] = [];

    // Document title
    lines.push(`# ${document.title}`);
    lines.push("");

    // Document metadata
    lines.push(`**種別**: ${getDocumentKindLabel(document.kind)}`);
    lines.push(`**バージョン**: ${document.version}`);
    if (document.tags && document.tags.length > 0) {
      lines.push(`**タグ**: ${document.tags.join(", ")}`);
    }
    lines.push("");
    lines.push("---");
    lines.push("");

    // Sections
    for (const section of document.sections) {
      const sectionMarkdown = renderSection(section, fieldValues);
      lines.push(sectionMarkdown);
      lines.push("");
    }

    return { success: true, data: lines.join("\n") };
  } catch (error) {
    return {
      success: false,
      error: `Failed to export to Markdown: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

function getDocumentKindLabel(kind: string): string {
  const labels: Record<string, string> = {
    "screen-spec": "画面設計書",
    "api-spec": "API設計書",
    "er-spec": "ER設計書",
    "business-rule": "ビジネスルール"
  };
  return labels[kind] ?? kind;
}

function renderSection(
  section: Section,
  fieldValues: Record<string, FieldValue>
): string {
  const lines: string[] = [];

  // Section title
  lines.push(`## ${section.title}`);
  if (section.description) {
    lines.push("");
    lines.push(`*${section.description}*`);
  }
  lines.push("");

  // Fields
  for (const field of section.fields) {
    const fieldMarkdown = renderField(field, fieldValues[field.id]);
    if (fieldMarkdown) {
      lines.push(fieldMarkdown);
      lines.push("");
    }
  }

  return lines.join("\n");
}

function renderField(field: Field, value: FieldValue): string {
  const lines: string[] = [];

  if (field.valueType === "table" && field.table) {
    // Table field
    lines.push(`### ${field.label}`);
    if (field.description) {
      lines.push("");
      lines.push(`*${field.description}*`);
    }
    lines.push("");

    const rows = value as TableRowValue[] | undefined;
    if (rows && rows.length > 0) {
      const tableMarkdown = renderTable(field.table.columns, rows);
      lines.push(tableMarkdown);
    } else {
      lines.push("*(データなし)*");
    }
  } else {
    // Simple field
    lines.push(`### ${field.label}`);
    lines.push("");

    const displayValue = formatFieldValue(field, value);
    if (displayValue) {
      lines.push(displayValue);
    } else {
      lines.push("*(未入力)*");
    }
  }

  return lines.join("\n");
}

function renderTable(columns: Field[], rows: TableRowValue[]): string {
  const lines: string[] = [];

  // Header row
  const headerCells = columns.map((col) => col.label);
  lines.push(`| ${headerCells.join(" | ")} |`);

  // Separator row
  const separatorCells = columns.map(() => "---");
  lines.push(`| ${separatorCells.join(" | ")} |`);

  // Data rows
  for (const row of rows) {
    const cells = columns.map((col) => {
      const cellValue = row[col.key];
      return formatCellValue(col, cellValue);
    });
    lines.push(`| ${cells.join(" | ")} |`);
  }

  return lines.join("\n");
}

function formatFieldValue(field: Field, value: FieldValue): string {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  switch (field.valueType) {
    case "boolean":
      return value ? "はい" : "いいえ";
    case "enum":
      return getEnumLabel(field, value as string);
    case "reference":
      return formatReferenceValue(value as ReferenceValue);
    case "textarea":
      return String(value);
    default:
      return String(value);
  }
}

function formatCellValue(column: Field, value: TableRowCellValue): string {
  if (value === undefined || value === null || value === "") {
    return "-";
  }

  switch (column.valueType) {
    case "boolean":
      return value ? "○" : "-";
    case "enum":
      return getEnumLabel(column, value as string);
    case "reference":
      return formatReferenceValue(value as ReferenceValue);
    default:
      return escapeMarkdownTableCell(String(value));
  }
}

function getEnumLabel(field: Field, value: string): string {
  const option = field.options?.find((opt) => opt.value === value);
  return option?.label ?? value;
}

function formatReferenceValue(value: ReferenceValue): string {
  if (!value) {
    return "-";
  }
  return value.refId ?? value.documentId ?? "-";
}

function escapeMarkdownTableCell(text: string): string {
  return text
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ")
    .replace(/\r/g, "");
}

/**
 * Generate filename for Markdown export
 */
export function generateMarkdownFilename(document: Document): string {
  const sanitizedTitle = document.title.replace(/[^a-zA-Z0-9_-]/g, "_");
  const timestamp = new Date().toISOString().slice(0, 10);
  return `${sanitizedTitle}_${timestamp}.md`;
}
