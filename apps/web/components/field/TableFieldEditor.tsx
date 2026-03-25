"use client";

import { useState, type CSSProperties } from "react";
import type { Field, Table } from "@specforge/document-schema";

import type { TableRowValue } from "../../lib/document-editor/create-document-state";

interface TableFieldEditorProps {
  field: Field;
  table: Table;
  rows: TableRowValue[];
  hasError?: boolean;
  cellErrors?: Set<string>;
  cellWarnings?: Set<string>;
  onRowsChange: (rows: TableRowValue[]) => void;
  apiReferenceOptions?: { id: string; value: string; label: string }[];
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

const thStyle: CSSProperties = {
  padding: "6px 8px",
  borderBottom: "2px solid #E2E8F0",
  textAlign: "left",
  fontWeight: 600,
  fontSize: "0.8rem",
  color: "#334155",
  backgroundColor: "#F8FAFC",
};

const DESCRIPTION_TRUNCATE = 50;

const tdStyle: CSSProperties = {
  padding: "4px 6px",
  borderBottom: "1px solid #F1F5F9",
  verticalAlign: "top",
};

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
  return {
    width: "100%",
    border,
    borderRadius: "4px",
    padding: "5px 7px",
    fontSize: "0.825rem",
    color: "#0F172A",
    backgroundColor: bg,
    boxSizing: "border-box" as const,
    outline: "none",
  };
}

const deleteButtonStyle: CSSProperties = {
  background: "none",
  border: "1px solid #E2E8F0",
  borderRadius: "4px",
  padding: "4px 8px",
  fontSize: "0.7rem",
  color: "#94A3B8",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const addButtonStyle: CSSProperties = {
  background: "none",
  border: "1px solid #CBD5E1",
  borderRadius: "6px",
  padding: "6px 14px",
  fontSize: "0.8rem",
  color: "#475569",
  cursor: "pointer",
  fontWeight: 500,
};

function ColumnHeader({ column }: { column: Field }) {
  const [expanded, setExpanded] = useState(false);
  const desc = column.description ?? "";
  const isLong = desc.length > DESCRIPTION_TRUNCATE;
  const displayDesc = !isLong || expanded ? desc : desc.slice(0, DESCRIPTION_TRUNCATE) + "...";

  return (
    <th style={thStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: "3px", whiteSpace: "nowrap" }}>
        <span>{column.label}</span>
        {column.required && (
          <span
            style={{
              color: "#EF4444",
              fontSize: "0.7rem",
              fontWeight: 600,
              marginLeft: "1px",
            }}
          >
            *
          </span>
        )}
      </div>
      {desc && (
        <div
          style={{
            fontWeight: 400,
            fontSize: "0.68rem",
            color: "#64748B",
            marginTop: "2px",
            lineHeight: "1.4",
            whiteSpace: "normal",
            maxWidth: "180px",
          }}
        >
          {displayDesc}
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((p) => !p)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                marginLeft: "3px",
                fontSize: "0.65rem",
                color: "#3B82F6",
                cursor: "pointer",
              }}
            >
              {expanded ? "閉じる" : "..."}
            </button>
          )}
        </div>
      )}
    </th>
  );
}

export function TableFieldEditor({
  field,
  table,
  rows,
  hasError,
  cellErrors,
  cellWarnings,
  onRowsChange,
  apiReferenceOptions,
}: TableFieldEditorProps) {
  const columns = table.columns;

  const handleCellChange = (
    rowIndex: number,
    columnKey: string,
    value: string | number | boolean | undefined
  ) => {
    const newRows = rows.map((row, index) => {
      if (index !== rowIndex) return row;
      return { ...row, [columnKey]: value };
    });
    onRowsChange(newRows);
  };

  const handleAddRow = () => {
    if (table.maxRows !== undefined && rows.length >= table.maxRows) return;
    onRowsChange([...rows, createEmptyRow(columns)]);
  };

  const handleDeleteRow = (rowIndex: number) => {
    onRowsChange(rows.filter((_, index) => index !== rowIndex));
  };

  if (rows.length === 0) {
    // Show column hints in empty state
    const columnHints = columns
      .filter((col) => col.required)
      .map((col) => col.label)
      .join("、");

    return (
      <div
        style={{
          border: hasError ? "1.5px solid #EF4444" : "1px dashed #CBD5E1",
          borderRadius: "6px",
          padding: "20px",
          textAlign: "center",
          backgroundColor: hasError ? "#FFFBFB" : "#F8FAFC",
        }}
      >
        <p
          style={{
            margin: "0 0 6px",
            color: "#94A3B8",
            fontSize: "0.825rem",
          }}
        >
          行を追加してください
        </p>
        {columnHints && (
          <p
            style={{
              margin: "0 0 10px",
              color: "#CBD5E1",
              fontSize: "0.72rem",
            }}
          >
            必須列: {columnHints}
          </p>
        )}
        <button type="button" style={addButtonStyle} onClick={handleAddRow}>
          + 行を追加
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        border: hasError ? "1.5px solid #EF4444" : "1px solid #E2E8F0",
        borderRadius: "6px",
        overflow: "hidden",
        backgroundColor: hasError ? "#FFFBFB" : "#FFFFFF",
      }}
    >
      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              {columns.map((col) => (
                <ColumnHeader key={col.id} column={col} />
              ))}
              <th
                style={{
                  ...thStyle,
                  width: "50px",
                  textAlign: "center",
                }}
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const rowIsEmpty = isRowEmpty(row, columns);
              return (
                <tr
                  key={rowIndex}
                  style={{
                    backgroundColor: rowIsEmpty ? "#FFFBEB" : undefined,
                  }}
                >
                  {columns.map((col) => {
                    const cellKey = `${field.id}:row${rowIndex}:${col.key}`;
                    const cellHasError = cellErrors?.has(cellKey) ?? false;
                    const cellHasWarning = cellWarnings?.has(cellKey) ?? false;

                    return (
                      <td key={col.id} style={tdStyle}>
                        {renderCellInput(
                          col,
                          row[col.key],
                          cellHasError,
                          cellHasWarning,
                          (value) =>
                            handleCellChange(rowIndex, col.key, value),
                          apiReferenceOptions
                        )}
                      </td>
                    );
                  })}
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <button
                      type="button"
                      style={deleteButtonStyle}
                      onClick={() => handleDeleteRow(rowIndex)}
                    >
                      削除
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div
        style={{
          padding: "8px 10px",
          borderTop: "1px solid #F1F5F9",
          backgroundColor: "#FAFBFC",
        }}
      >
        <button type="button" style={addButtonStyle} onClick={handleAddRow}>
          + 行を追加
        </button>
        {table.maxRows !== undefined && (
          <span
            style={{
              marginLeft: "8px",
              fontSize: "0.7rem",
              color: "#94A3B8",
            }}
          >
            （最大 {table.maxRows} 行）
          </span>
        )}
      </div>
    </div>
  );
}

function renderCellInput(
  column: Field,
  value: string | number | boolean | undefined,
  hasError: boolean,
  hasWarning: boolean,
  onChange: (value: string | number | boolean | undefined) => void,
  apiReferenceOptions?: { id: string; value: string; label: string }[]
) {
  const inputStyle = getCellInputStyle(hasError, hasWarning);

  // Special handling for targetDocumentId — render as API reference selector
  if (column.key === "targetDocumentId" && apiReferenceOptions) {
    return (
      <select
        style={{
          ...inputStyle,
          color: value ? "#0F172A" : "#94A3B8",
        }}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">API仕様書を選択</option>
        {apiReferenceOptions.map((opt) => (
          <option key={opt.id} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  if (column.valueType === "boolean") {
    const normalizedValue =
      typeof value === "boolean" ? String(value) : "";
    return (
      <select
        style={inputStyle}
        value={normalizedValue}
        onChange={(e) => {
          if (e.target.value === "") {
            onChange(undefined);
            return;
          }
          onChange(e.target.value === "true");
        }}
      >
        <option value="">未選択</option>
        <option value="true">はい</option>
        <option value="false">いいえ</option>
      </select>
    );
  }

  if (column.valueType === "enum" && column.options) {
    return (
      <select
        style={inputStyle}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">選択してください</option>
        {column.options.map((option) => (
          <option key={option.id} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  // Default: text input
  return (
    <input
      type="text"
      style={inputStyle}
      placeholder={column.placeholder ?? ""}
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
