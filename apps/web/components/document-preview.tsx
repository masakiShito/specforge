"use client";

import type { CSSProperties } from "react";
import type { Document, Field, Section } from "@specforge/document-schema";
import type { DocumentEditorState, FieldValue, TableRowValue } from "../lib/document-editor/create-document-state";
import { isReferenceValue } from "../lib/reference/model";

const KIND_LABELS: Record<string, string> = {
  "screen-spec": "画面仕様書",
  "api-spec": "API仕様書",
  "er-spec": "ER仕様書",
  "business-rule": "業務ルール仕様書",
};

interface DocumentPreviewProps {
  document: Document;
  state: DocumentEditorState;
}

function formatFieldValue(field: Field, value: FieldValue): string {
  if (value === undefined || value === null || value === "") {
    return "—";
  }

  if (field.valueType === "boolean") {
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return "—";
  }

  if (field.valueType === "enum" && field.options) {
    const option = field.options.find((o) => o.value === value);
    return option?.label ?? String(value);
  }

  if (isReferenceValue(value)) {
    return value.refId ? `[参照: ${value.refId}]` : "—";
  }

  return String(value);
}

const sectionHeaderStyle: CSSProperties = {
  margin: "0 0 12px",
  fontSize: "1rem",
  fontWeight: 700,
  color: "#0F172A",
  borderBottom: "2px solid #3B82F6",
  paddingBottom: "6px",
};

const fieldLabelStyle: CSSProperties = {
  fontSize: "0.78rem",
  fontWeight: 600,
  color: "#64748B",
  marginBottom: "2px",
};

const fieldValueStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#0F172A",
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const emptyValueStyle: CSSProperties = {
  ...fieldValueStyle,
  color: "#CBD5E1",
  fontStyle: "italic",
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.8rem",
};

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "6px 10px",
  fontWeight: 600,
  fontSize: "0.72rem",
  color: "#475569",
  backgroundColor: "#F8FAFC",
  borderBottom: "2px solid #E2E8F0",
  whiteSpace: "nowrap",
};

const tdStyle: CSSProperties = {
  padding: "6px 10px",
  color: "#0F172A",
  borderBottom: "1px solid #F1F5F9",
  verticalAlign: "top",
};

function PreviewTable({ field, rows }: { field: Field; rows: TableRowValue[] }) {
  const columns = field.table?.columns ?? [];
  if (columns.length === 0) return null;

  if (rows.length === 0) {
    return (
      <p style={emptyValueStyle}>データなし</p>
    );
  }

  return (
    <div style={{ overflowX: "auto", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.id} style={thStyle}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} style={{ backgroundColor: rowIndex % 2 === 1 ? "#FAFBFC" : "transparent" }}>
              {columns.map((col) => {
                const cellValue = row[col.key];
                const displayValue = formatFieldValue(col, cellValue);
                const isEmpty = displayValue === "—";

                return (
                  <td key={col.id} style={{ ...tdStyle, color: isEmpty ? "#CBD5E1" : "#0F172A" }}>
                    {displayValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PreviewField({ field, value }: { field: Field; value: FieldValue }) {
  // Table fields rendered specially
  if (field.valueType === "table" && field.table) {
    const rows = Array.isArray(value) ? (value as TableRowValue[]) : [];
    return (
      <div style={{ marginBottom: "12px" }}>
        <div style={fieldLabelStyle}>{field.label}</div>
        <PreviewTable field={field} rows={rows} />
      </div>
    );
  }

  const displayValue = formatFieldValue(field, value);
  const isEmpty = displayValue === "—";

  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={fieldLabelStyle}>{field.label}</div>
      <div style={isEmpty ? emptyValueStyle : fieldValueStyle}>
        {displayValue}
      </div>
    </div>
  );
}

function PreviewSection({ section, fieldValues }: { section: Section; fieldValues: Record<string, FieldValue> }) {
  return (
    <div style={{ marginBottom: "28px" }}>
      <h3 style={sectionHeaderStyle}>{section.title}</h3>
      {section.description && (
        <p style={{ margin: "0 0 12px", fontSize: "0.75rem", color: "#94A3B8", lineHeight: 1.5 }}>
          {section.description}
        </p>
      )}
      <div style={{ display: "grid", gap: "4px" }}>
        {section.fields.map((field) => (
          <PreviewField
            key={field.id}
            field={field}
            value={fieldValues[field.id]}
          />
        ))}
      </div>
    </div>
  );
}

export function DocumentPreview({ document, state }: DocumentPreviewProps) {
  const kindLabel = KIND_LABELS[document.kind] ?? document.kind;

  return (
    <div style={{ maxHeight: "calc(100vh - 160px)", overflowY: "auto", padding: "4px 0" }}>
      {/* Document header */}
      <div style={{ marginBottom: "24px", borderBottom: "1px solid #E2E8F0", paddingBottom: "16px" }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "#64748B", marginBottom: "4px" }}>
          {kindLabel}
        </div>
        <h2 style={{ margin: "0 0 4px", fontSize: "1.25rem", fontWeight: 700, color: "#0F172A" }}>
          {document.title}
        </h2>
        <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
          バージョン: {document.version}　｜　key: {document.key}
        </div>
      </div>

      {/* Sections */}
      {document.sections.map((section) => (
        <PreviewSection
          key={section.id}
          section={section}
          fieldValues={state.fieldValues}
        />
      ))}
    </div>
  );
}
