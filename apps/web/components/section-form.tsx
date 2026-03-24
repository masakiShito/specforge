import type { Section } from "@specforge/document-schema";

import type { FieldValue } from "../lib/document-editor/create-document-state";
import { FieldRenderer } from "./field-renderer";

interface SectionFormProps {
  section: Section;
  fieldValues: Record<string, FieldValue>;
  onValueChange: (fieldId: string, value: FieldValue) => void;
}

export function SectionForm({ section, fieldValues, onValueChange }: SectionFormProps) {
  return (
    <section>
      <header style={{ marginBottom: "12px" }}>
        <h2 style={{ margin: 0, fontSize: "1.25rem" }}>{section.title}</h2>
        <p style={{ margin: "6px 0 0", color: "#475569", fontSize: "0.95rem" }}>
          key: {section.key} / required: {String(section.required)}
        </p>
      </header>

      <div style={{ display: "grid", gap: "12px" }}>
        {section.fields.map((field) => (
          <div
            key={field.id}
            style={{
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
              padding: "12px",
              backgroundColor: "#FFFFFF"
            }}
          >
            <label style={{ display: "block", fontWeight: 600, marginBottom: "6px" }}>
              {field.label}
              {field.required ? <span style={{ color: "#B91C1C", marginLeft: "6px" }}>*required</span> : null}
            </label>
            <p style={{ margin: "0 0 8px", color: "#64748B", fontSize: "0.85rem" }}>
              key: {field.key} / valueType: {field.valueType}
            </p>
            <FieldRenderer field={field} value={fieldValues[field.id]} onValueChange={onValueChange} />
          </div>
        ))}
      </div>
    </section>
  );
}
