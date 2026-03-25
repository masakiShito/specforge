"use client";

import { useState, type CSSProperties } from "react";
import type { Field, Project, Table } from "@specforge/document-schema";

import type { DocumentEditorState, TableRowValue } from "../../lib/document-editor/create-document-state";
import { isReferenceValue, toReferenceValue } from "../../lib/reference/model";
import { getApiReferenceCandidates, resolveReferenceLabel } from "../../lib/reference/helpers";

interface TableFieldEditorProps {
  field: Field;
  table: Table;
  rows: TableRowValue[];
  hasError?: boolean;
  cellErrors?: Set<string>;
  cellWarnings?: Set<string>;
  onRowsChange: (rows: TableRowValue[]) => void;
  project: Project;
  documentStates: Record<string, DocumentEditorState>;
  onNavigateToReference?: (referenceId: string) => void;
}

function createEmptyRow(columns: Field[]): TableRowValue {
  const row: TableRowValue = {};
  for (const column of columns) {
    row[column.key] = column.valueType === "boolean" ? undefined : "";
  }
  return row;
}

function isRowEmpty(row: TableRowValue, columns: Field[]): boolean {
  return columns.every((col) => {
    const value = row[col.key];
    return value === undefined || value === null || value === "";
  });
}

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.825rem",
};
const thStyle: CSSProperties = { padding: "6px 8px", borderBottom: "2px solid #E2E8F0", textAlign: "left", fontWeight: 600, fontSize: "0.8rem", color: "#334155", backgroundColor: "#F8FAFC" };
const tdStyle: CSSProperties = { padding: "4px 6px", borderBottom: "1px solid #F1F5F9", verticalAlign: "top" };

function getCellInputStyle(hasError: boolean, hasWarning?: boolean): CSSProperties {
  let border = "1px solid #E2E8F0";
  let bg = "#FFFFFF";
  if (hasError) {
    border = "1.5px solid #EF4444";
    bg = "#FFFBFB";
  } else if (hasWarning) {
    border = "1.5px solid #F59E0B";
    bg = "#FFFEF5";
  }
  return { width: "100%", border, borderRadius: "4px", padding: "5px 7px", fontSize: "0.825rem", color: "#0F172A", backgroundColor: bg, boxSizing: "border-box", outline: "none" };
}

function ColumnHeader({ column }: { column: Field }) {
  const [expanded, setExpanded] = useState(false);
  const desc = column.description ?? "";
  const isLong = desc.length > 50;
  const displayDesc = !isLong || expanded ? desc : desc.slice(0, 50) + "...";

  return (
    <th style={thStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: "3px", whiteSpace: "nowrap" }}>
        <span>{column.label}</span>
        {column.required && <span style={{ color: "#EF4444", fontSize: "0.7rem", fontWeight: 600 }}>*</span>}
      </div>
      {desc && (
        <div style={{ fontWeight: 400, fontSize: "0.68rem", color: "#64748B", marginTop: "2px", lineHeight: "1.4", whiteSpace: "normal", maxWidth: "180px" }}>
          {displayDesc}
          {isLong && <button type="button" onClick={() => setExpanded((p) => !p)} style={{ background: "none", border: "none", padding: 0, marginLeft: "3px", fontSize: "0.65rem", color: "#3B82F6", cursor: "pointer" }}>{expanded ? "閉じる" : "..."}</button>}
        </div>
      )}
    </th>
  );
}

export function TableFieldEditor({ field, table, rows, hasError, cellErrors, cellWarnings, onRowsChange, project, documentStates, onNavigateToReference }: TableFieldEditorProps) {
  const columns = table.columns;
  const apiReferenceCandidates = getApiReferenceCandidates(project, documentStates);

  const handleCellChange = (rowIndex: number, columnKey: string, value: TableRowValue[string]) => {
    const nextRows = rows.map((row, index) => (index === rowIndex ? { ...row, [columnKey]: value } : row));
    onRowsChange(nextRows);
  };

  return (
    <div style={{ border: hasError ? "1.5px solid #EF4444" : "1px solid #E2E8F0", borderRadius: "6px", overflow: "hidden", backgroundColor: hasError ? "#FFFBFB" : "#FFFFFF" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead><tr>{columns.map((c) => <ColumnHeader key={c.id} column={c} />)}<th style={{ ...thStyle, width: "50px", textAlign: "center" }}>操作</th></tr></thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} style={{ backgroundColor: isRowEmpty(row, columns) ? "#FFFBEB" : undefined }}>
                {columns.map((col) => {
                  const cellKey = `${field.id}:row${rowIndex}:${col.key}`;
                  return (
                    <td key={col.id} style={tdStyle}>
                      {renderCellInput(
                        col,
                        row[col.key],
                        cellErrors?.has(cellKey) ?? false,
                        cellWarnings?.has(cellKey) ?? false,
                        (value) => handleCellChange(rowIndex, col.key, value),
                        apiReferenceCandidates,
                        project,
                        documentStates,
                        onNavigateToReference,
                      )}
                    </td>
                  );
                })}
                <td style={{ ...tdStyle, textAlign: "center" }}><button type="button" style={{ background: "none", border: "1px solid #E2E8F0", borderRadius: "4px", padding: "4px 8px", fontSize: "0.7rem", color: "#94A3B8", cursor: "pointer" }} onClick={() => onRowsChange(rows.filter((_, i) => i !== rowIndex))}>削除</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ padding: "8px 10px", borderTop: "1px solid #F1F5F9", backgroundColor: "#FAFBFC" }}>
        <button type="button" style={{ background: "none", border: "1px solid #CBD5E1", borderRadius: "6px", padding: "6px 14px", fontSize: "0.8rem", color: "#475569", cursor: "pointer", fontWeight: 500 }} onClick={() => onRowsChange([...rows, createEmptyRow(columns)])}>+ 行を追加</button>
      </div>
    </div>
  );
}

function renderCellInput(
  column: Field,
  value: TableRowValue[string],
  hasError: boolean,
  hasWarning: boolean,
  onChange: (value: TableRowValue[string]) => void,
  apiReferenceCandidates: ReturnType<typeof getApiReferenceCandidates>,
  project: Project,
  documentStates: Record<string, DocumentEditorState>,
  onNavigateToReference?: (referenceId: string) => void,
) {
  const inputStyle = getCellInputStyle(hasError, hasWarning);

  if (column.valueType === "reference" && column.reference?.kind === "document") {
    const currentRef = isReferenceValue(value) ? value : undefined;

    return (
      <div>
        <select
          style={inputStyle}
          value={currentRef?.documentId ?? ""}
          onChange={(event) => {
            const selected = apiReferenceCandidates.find((item) => item.documentId === event.target.value);
            onChange(selected ? toReferenceValue(selected) : undefined);
          }}
        >
          <option value="">選択してください</option>
          {apiReferenceCandidates.map((option) => (
            <option key={option.id} value={option.documentId}>{option.label}</option>
          ))}
        </select>
        {currentRef && (
          <button
            type="button"
            onClick={() => onNavigateToReference?.(currentRef.refId)}
            style={{ marginTop: "4px", border: "none", background: "none", color: "#2563EB", fontSize: "0.7rem", cursor: "pointer", padding: 0 }}
          >
            {resolveReferenceLabel(project, documentStates, currentRef, "参照先へ移動")}
          </button>
        )}
      </div>
    );
  }

  if (column.valueType === "enum") {
    return <select style={inputStyle} value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)}><option value="">選択してください</option>{column.options?.map((option) => <option key={option.id} value={option.value}>{option.label}</option>)}</select>;
  }

  if (column.valueType === "boolean") {
    const normalizedValue = typeof value === "boolean" ? String(value) : "";
    return <select style={inputStyle} value={normalizedValue} onChange={(event) => onChange(event.target.value === "" ? undefined : event.target.value === "true")}><option value="">未選択</option><option value="true">はい</option><option value="false">いいえ</option></select>;
  }

  if (column.valueType === "number") {
    return <input type="number" style={inputStyle} value={typeof value === "number" ? value : ""} onChange={(event) => onChange(event.target.value === "" ? undefined : Number(event.target.value))} />;
  }

  return <input type="text" style={inputStyle} value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} />;
}
