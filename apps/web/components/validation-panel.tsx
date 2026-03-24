import type { Document } from "@specforge/document-schema";

import type { DocumentEditorState } from "../lib/document-editor/create-document-state";
import type { ValidationWarning } from "../lib/document-editor/validate-document";

interface ValidationPanelProps {
  document: Document;
  state: DocumentEditorState;
  warnings: ValidationWarning[];
}

function buildPreview(document: Document, state: DocumentEditorState) {
  return {
    id: document.id,
    key: document.key,
    title: document.title,
    kind: document.kind,
    version: document.version,
    sections: document.sections.map((section) => ({
      id: section.id,
      key: section.key,
      title: section.title,
      fields: section.fields.map((field) => ({
        id: field.id,
        key: field.key,
        label: field.label,
        valueType: field.valueType,
        required: field.required,
        value: state.fieldValues[field.id]
      }))
    }))
  };
}

export function ValidationPanel({ document, state, warnings }: ValidationPanelProps) {
  const preview = buildPreview(document, state);

  return (
    <aside style={{ display: "grid", gap: "12px" }}>
      <section style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "12px", backgroundColor: "#FFFFFF" }}>
        <h3 style={{ marginTop: 0, marginBottom: "10px" }}>Validation Warnings</h3>
        {warnings.length === 0 ? (
          <p style={{ margin: 0, color: "#166534" }}>必須項目の未入力はありません。</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: "18px", color: "#991B1B" }}>
            {warnings.map((warning) => (
              <li key={warning.id} style={{ marginBottom: "6px" }}>
                [{warning.sectionTitle}] {warning.fieldLabel}: {warning.message}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "12px", backgroundColor: "#FFFFFF" }}>
        <h3 style={{ marginTop: 0, marginBottom: "10px" }}>Document State JSON</h3>
        <pre
          style={{
            margin: 0,
            maxHeight: "420px",
            overflow: "auto",
            fontSize: "0.78rem",
            backgroundColor: "#0F172A",
            color: "#E2E8F0",
            padding: "10px",
            borderRadius: "8px"
          }}
        >
          {JSON.stringify(preview, null, 2)}
        </pre>
      </section>
    </aside>
  );
}
