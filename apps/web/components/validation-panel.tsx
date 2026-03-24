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
    <aside style={{ display: "grid", gap: "16px", minWidth: 0 }}>
      <section
        style={{
          border: "1px solid #E2E8F0",
          borderRadius: "8px",
          padding: "16px",
          backgroundColor: "#FFFFFF"
        }}
      >
        <h3 style={{ margin: "0 0 12px", fontSize: "0.875rem", fontWeight: 600, color: "#0F172A" }}>
          バリデーション
        </h3>
        {warnings.length === 0 ? (
          <p style={{ margin: 0, color: "#22C55E", fontSize: "0.8rem", fontWeight: 500 }}>
            未入力の必須項目はありません
          </p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: "16px", display: "grid", gap: "4px" }}>
            {warnings.map((warning) => (
              <li key={warning.id} style={{ fontSize: "0.8rem", color: "#EF4444" }}>
                <span style={{ fontWeight: 500 }}>{warning.sectionTitle}</span>
                {" — "}
                {warning.fieldLabel}: {warning.message}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        style={{
          border: "1px solid #E2E8F0",
          borderRadius: "8px",
          padding: "16px",
          backgroundColor: "#FFFFFF"
        }}
      >
        <h3 style={{ margin: "0 0 12px", fontSize: "0.875rem", fontWeight: 600, color: "#0F172A" }}>
          ドキュメント JSON
        </h3>
        <pre
          style={{
            margin: 0,
            maxHeight: "420px",
            overflow: "auto",
            fontSize: "0.72rem",
            lineHeight: "1.5",
            backgroundColor: "#1E293B",
            color: "#E2E8F0",
            padding: "12px",
            borderRadius: "6px",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all" as const
          }}
        >
          {JSON.stringify(preview, null, 2)}
        </pre>
      </section>
    </aside>
  );
}
