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
  border: "1px solid #CBD5E1",
  borderRadius: "6px",
  padding: "8px"
};

export function FieldRenderer({ field, value, onValueChange }: FieldRendererProps) {
  if (field.valueType === "text") {
    return (
      <input
        style={inputStyle}
        type="text"
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onValueChange(field.id, event.target.value)}
      />
    );
  }

  if (field.valueType === "textarea") {
    return (
      <textarea
        style={{ ...inputStyle, minHeight: "90px" }}
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
        <option value="true">true</option>
        <option value="false">false</option>
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
      <div style={{ border: "1px dashed #94A3B8", borderRadius: "6px", padding: "8px", color: "#334155" }}>
        この型（{field.valueType}）は今回の最小実装では未対応です。
      </div>
    );
  }

  return (
    <div style={{ border: "1px dashed #EF4444", borderRadius: "6px", padding: "8px", color: "#B91C1C" }}>
      Unknown field type.
    </div>
  );
}
