import { forwardRef, type CSSProperties, type Ref } from "react";
import type { Field } from "@specforge/document-schema";

import type { FieldValue, TableRowValue } from "../lib/document-editor/create-document-state";
import { TableFieldEditor } from "./field/TableFieldEditor";

interface FieldRendererProps {
  field: Field;
  value: FieldValue;
  hasError?: boolean;
  cellErrors?: Set<string>;
  cellWarnings?: Set<string>;
  onValueChange: (fieldId: string, value: FieldValue) => void;
}

function getInputStyle(hasError: boolean): CSSProperties {
  return {
    width: "100%",
    border: hasError ? "1.5px solid #EF4444" : "1px solid #E2E8F0",
    borderRadius: "6px",
    padding: "8px 10px",
    fontSize: "0.875rem",
    color: "#0F172A",
    backgroundColor: hasError ? "#FFFBFB" : "#FFFFFF",
    boxSizing: "border-box",
    outline: "none",
  };
}

export const FieldRenderer = forwardRef(function FieldRenderer(
  { field, value, hasError = false, cellErrors, cellWarnings, onValueChange }: FieldRendererProps,
  ref: Ref<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) {
  const style = getInputStyle(hasError);

  if (field.valueType === "text") {
    return (
      <input
        ref={ref as Ref<HTMLInputElement>}
        style={style}
        type="text"
        placeholder="テキストを入力"
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onValueChange(field.id, event.target.value)}
      />
    );
  }

  if (field.valueType === "textarea") {
    return (
      <textarea
        ref={ref as Ref<HTMLTextAreaElement>}
        style={{ ...style, minHeight: "100px", resize: "vertical" }}
        placeholder="テキストを入力"
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onValueChange(field.id, event.target.value)}
      />
    );
  }

  if (field.valueType === "boolean") {
    const normalizedValue = typeof value === "boolean" ? String(value) : "";

    return (
      <select
        ref={ref as Ref<HTMLSelectElement>}
        style={style}
        value={normalizedValue}
        onChange={(event) => {
          if (event.target.value === "") {
            onValueChange(field.id, undefined);
            return;
          }

          onValueChange(field.id, event.target.value === "true");
        }}
      >
        <option value="">未選択</option>
        <option value="true">はい</option>
        <option value="false">いいえ</option>
      </select>
    );
  }

  if (field.valueType === "enum") {
    return (
      <select
        ref={ref as Ref<HTMLSelectElement>}
        style={style}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onValueChange(field.id, event.target.value)}
      >
        <option value="">選択してください</option>
        {field.options?.map((option) => (
          <option key={option.id} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.valueType === "table" && field.table) {
    const rows = Array.isArray(value) ? (value as TableRowValue[]) : [];
    return (
      <TableFieldEditor
        field={field}
        table={field.table}
        rows={rows}
        hasError={hasError}
        cellErrors={cellErrors}
        cellWarnings={cellWarnings}
        onRowsChange={(newRows) => onValueChange(field.id, newRows)}
      />
    );
  }

  if (field.valueType === "reference" || field.valueType === "number" || (field.valueType === "table" && !field.table)) {
    return (
      <div
        style={{
          border: "1px dashed #CBD5E1",
          borderRadius: "6px",
          padding: "10px 12px",
          color: "#94A3B8",
          fontSize: "0.8rem",
          backgroundColor: "#F8FAFC"
        }}
      >
        この型（{field.valueType}）は現在未対応です
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px dashed #FCA5A5",
        borderRadius: "6px",
        padding: "10px 12px",
        color: "#EF4444",
        fontSize: "0.8rem",
        backgroundColor: "#FEF2F2"
      }}
    >
      不明なフィールド型です
    </div>
  );
});
