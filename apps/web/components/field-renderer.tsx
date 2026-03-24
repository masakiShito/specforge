import type { CSSProperties } from "react";
import type { Field } from "@specforge/document-schema";

import type { FieldValue } from "../lib/document-editor/create-document-state";

interface FieldRendererProps {
  field: Field;
  value: FieldValue;
  onValueChange: (fieldId: string, value: FieldValue) => void;
}

const inputStyle: CSSProperties = {
  width: "100%",
  border: "1px solid #E2E8F0",
  borderRadius: "6px",
  padding: "8px 10px",
  fontSize: "0.875rem",
  color: "#0F172A",
  backgroundColor: "#FFFFFF",
  boxSizing: "border-box",
  outline: "none"
};

export function FieldRenderer({ field, value, onValueChange }: FieldRendererProps) {
  if (field.valueType === "text") {
    return (
      <input
        style={inputStyle}
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
        style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
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
        style={inputStyle}
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
        style={inputStyle}
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

  if (field.valueType === "table" || field.valueType === "reference" || field.valueType === "number") {
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
}
