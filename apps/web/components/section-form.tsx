import type { Section } from "@specforge/document-schema";

import type { FieldValue } from "../lib/document-editor/create-document-state";
import { FieldDescription } from "./field/FieldDescription";
import { FieldRenderer } from "./field-renderer";

interface SectionFormProps {
  section: Section;
  fieldValues: Record<string, FieldValue>;
  onValueChange: (fieldId: string, value: FieldValue) => void;
}

export function SectionForm({ section, fieldValues, onValueChange }: SectionFormProps) {
  return (
    <section>
      <header style={{ marginBottom: "16px", borderBottom: "1px solid #F1F5F9", paddingBottom: "12px" }}>
        <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600, color: "#0F172A" }}>{section.title}</h2>
        <p style={{ margin: "4px 0 0", color: "#94A3B8", fontSize: "0.75rem" }}>
          {section.required ? "必須セクション" : "任意セクション"}
        </p>
      </header>

      <div style={{ display: "grid", gap: "16px" }}>
        {section.fields.map((field) => (
          <div key={field.id}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: 600,
                fontSize: "0.875rem",
                color: "#334155",
                marginBottom: field.description ? "2px" : "6px"
              }}
            >
              {field.label}
              {field.required && (
                <>
                  <span
                    style={{
                      color: "#EF4444",
                      fontSize: "0.875rem",
                      lineHeight: 1,
                    }}
                    aria-hidden="true"
                  >
                    *
                  </span>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      color: "#EF4444",
                      border: "1px solid #FCA5A5",
                      borderRadius: "4px",
                      padding: "0 4px",
                      lineHeight: "1.6"
                    }}
                  >
                    必須
                  </span>
                </>
              )}
            </label>
            <FieldDescription description={field.description} />
            <FieldRenderer field={field} value={fieldValues[field.id]} onValueChange={onValueChange} />
          </div>
        ))}
      </div>
    </section>
  );
}
