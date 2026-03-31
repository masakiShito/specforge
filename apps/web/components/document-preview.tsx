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
    return "";
  }

  if (field.valueType === "boolean") {
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return "";
  }

  if (field.valueType === "enum" && field.options) {
    const option = field.options.find((o) => o.value === value);
    return option?.label ?? String(value);
  }

  if (isReferenceValue(value)) {
    return value.refId ? `参照: ${value.refId}` : "";
  }

  return String(value);
}

/* ---------- styles ---------- */

const pageStyle: CSSProperties = {
  maxHeight: "calc(100vh - 160px)",
  overflowY: "auto",
  padding: "32px 28px",
  fontFamily: "'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif",
  lineHeight: 1.8,
  color: "#1E293B",
};

const headerStyle: CSSProperties = {
  textAlign: "center",
  marginBottom: "36px",
  paddingBottom: "24px",
  borderBottom: "2px solid #334155",
};

const kindBadgeStyle: CSSProperties = {
  display: "inline-block",
  fontSize: "0.7rem",
  fontWeight: 600,
  color: "#475569",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: "8px",
};

const titleStyle: CSSProperties = {
  margin: "0 0 8px",
  fontSize: "1.4rem",
  fontWeight: 700,
  color: "#0F172A",
  letterSpacing: "0.02em",
};

const metaStyle: CSSProperties = {
  fontSize: "0.75rem",
  color: "#64748B",
};

const sectionStyle: CSSProperties = {
  marginBottom: "32px",
  pageBreakInside: "avoid",
};

const sectionHeaderStyle: CSSProperties = {
  margin: "0 0 4px",
  fontSize: "1.05rem",
  fontWeight: 700,
  color: "#0F172A",
  paddingBottom: "6px",
  borderBottom: "1px solid #CBD5E1",
};

const sectionDescStyle: CSSProperties = {
  margin: "0 0 14px",
  fontSize: "0.78rem",
  color: "#64748B",
  lineHeight: 1.6,
};

const fieldRowStyle: CSSProperties = {
  display: "flex",
  padding: "6px 0",
  borderBottom: "1px solid #F1F5F9",
  alignItems: "baseline",
};

const fieldLabelStyle: CSSProperties = {
  width: "160px",
  minWidth: "160px",
  fontSize: "0.8rem",
  fontWeight: 600,
  color: "#475569",
  paddingRight: "12px",
  flexShrink: 0,
};

const fieldValueStyle: CSSProperties = {
  flex: 1,
  fontSize: "0.875rem",
  color: "#1E293B",
  lineHeight: 1.7,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const emptyValueStyle: CSSProperties = {
  ...fieldValueStyle,
  color: "#D1D5DB",
  fontSize: "0.78rem",
};

const tableWrapStyle: CSSProperties = {
  marginTop: "4px",
  overflowX: "auto",
  borderRadius: "4px",
  border: "1px solid #D1D5DB",
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.8rem",
  lineHeight: 1.5,
};

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "8px 12px",
  fontWeight: 600,
  fontSize: "0.75rem",
  color: "#334155",
  backgroundColor: "#F1F5F9",
  borderBottom: "2px solid #CBD5E1",
  whiteSpace: "nowrap",
};

const tdStyle: CSSProperties = {
  padding: "7px 12px",
  color: "#1E293B",
  borderBottom: "1px solid #E5E7EB",
  verticalAlign: "top",
};

const tocStyle: CSSProperties = {
  margin: "0 0 32px",
  padding: "16px 20px",
  backgroundColor: "#F8FAFC",
  borderRadius: "6px",
  border: "1px solid #E2E8F0",
};

const tocTitleStyle: CSSProperties = {
  margin: "0 0 8px",
  fontSize: "0.78rem",
  fontWeight: 700,
  color: "#475569",
  letterSpacing: "0.04em",
};

const tocItemStyle: CSSProperties = {
  fontSize: "0.8rem",
  color: "#3B82F6",
  lineHeight: 2,
  cursor: "pointer",
};

/* ---------- components ---------- */

function PreviewTable({ field, rows }: { field: Field; rows: TableRowValue[] }) {
  const columns = field.table?.columns ?? [];
  if (columns.length === 0) return null;

  if (rows.length === 0) {
    return <span style={emptyValueStyle}>—</span>;
  }

  return (
    <div style={tableWrapStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={{ ...thStyle, width: "36px", textAlign: "center", color: "#94A3B8", fontWeight: 400 }}>#</th>
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
              <td style={{ ...tdStyle, textAlign: "center", color: "#94A3B8", fontSize: "0.72rem" }}>
                {rowIndex + 1}
              </td>
              {columns.map((col) => {
                const cellValue = row[col.key];
                const displayValue = formatFieldValue(col, cellValue);
                const isEmpty = !displayValue;

                return (
                  <td key={col.id} style={{ ...tdStyle, color: isEmpty ? "#D1D5DB" : "#1E293B" }}>
                    {isEmpty ? "—" : displayValue}
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
  if (field.valueType === "table" && field.table) {
    const rows = Array.isArray(value) ? (value as TableRowValue[]) : [];
    return (
      <div style={{ marginBottom: "16px" }}>
        <div style={{ ...fieldLabelStyle, width: "auto", marginBottom: "6px" }}>{field.label}</div>
        <PreviewTable field={field} rows={rows} />
      </div>
    );
  }

  const displayValue = formatFieldValue(field, value);
  const isEmpty = !displayValue;

  return (
    <div style={fieldRowStyle}>
      <div style={fieldLabelStyle}>{field.label}</div>
      <div style={isEmpty ? emptyValueStyle : fieldValueStyle}>
        {isEmpty ? "—" : displayValue}
      </div>
    </div>
  );
}

function PreviewSection({ section, fieldValues, index }: { section: Section; fieldValues: Record<string, FieldValue>; index: number }) {
  const tableFields: Field[] = [];
  const normalFields: Field[] = [];

  for (const field of section.fields) {
    if (field.valueType === "table" && field.table) {
      tableFields.push(field);
    } else {
      normalFields.push(field);
    }
  }

  return (
    <div id={`section-${section.id}`} style={sectionStyle}>
      <h3 style={sectionHeaderStyle}>
        <span style={{ color: "#94A3B8", fontWeight: 400, marginRight: "8px" }}>{index + 1}.</span>
        {section.title}
      </h3>
      {section.description && (
        <p style={sectionDescStyle}>{section.description}</p>
      )}

      {/* Normal fields in label-value rows */}
      {normalFields.length > 0 && (
        <div style={{ marginBottom: tableFields.length > 0 ? "16px" : "0" }}>
          {normalFields.map((field) => (
            <PreviewField
              key={field.id}
              field={field}
              value={fieldValues[field.id]}
            />
          ))}
        </div>
      )}

      {/* Table fields rendered full-width below */}
      {tableFields.map((field) => (
        <PreviewField
          key={field.id}
          field={field}
          value={fieldValues[field.id]}
        />
      ))}
    </div>
  );
}

export function DocumentPreview({ document, state }: DocumentPreviewProps) {
  const kindLabel = KIND_LABELS[document.kind] ?? document.kind;

  return (
    <div style={pageStyle}>
      {/* Document header */}
      <div style={headerStyle}>
        <div style={kindBadgeStyle}>{kindLabel}</div>
        <h2 style={titleStyle}>{document.title}</h2>
        <div style={metaStyle}>
          バージョン {document.version}　|　キー: {document.key}
        </div>
      </div>

      {/* Table of contents */}
      {document.sections.length > 1 && (
        <div style={tocStyle}>
          <div style={tocTitleStyle}>目次</div>
          {document.sections.map((section, i) => (
            <div
              key={section.id}
              style={tocItemStyle}
              onClick={() => {
                const el = window.document.getElementById(`section-${section.id}`);
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  const el = window.document.getElementById(`section-${section.id}`);
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              role="button"
              tabIndex={0}
            >
              {i + 1}. {section.title}
            </div>
          ))}
        </div>
      )}

      {/* Sections */}
      {document.sections.map((section, i) => (
        <PreviewSection
          key={section.id}
          section={section}
          fieldValues={state.fieldValues}
          index={i}
        />
      ))}

      {/* Footer */}
      <div style={{ marginTop: "40px", paddingTop: "16px", borderTop: "1px solid #E2E8F0", textAlign: "center" }}>
        <span style={{ fontSize: "0.7rem", color: "#94A3B8" }}>
          {kindLabel} — {document.title} v{document.version}
        </span>
      </div>
    </div>
  );
}
