"use client";

import { useState, type CSSProperties } from "react";
import type { Document } from "@specforge/document-schema";

import type { DocumentEditorState } from "../lib/document-editor/create-document-state";
import type { ValidationWarning } from "../lib/document-editor/validate-document";
import { guideContent } from "../data/guide";
import { GuidePanel } from "./guide/GuidePanel";

interface RightPanelProps {
  document: Document;
  state: DocumentEditorState;
  warnings: ValidationWarning[];
}

type TabId = "validation" | "json" | "guide";

const tabs: { id: TabId; label: string }[] = [
  { id: "validation", label: "バリデーション" },
  { id: "json", label: "JSON" },
  { id: "guide", label: "ガイド" },
];

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

const tabBarStyle: CSSProperties = {
  display: "flex",
  gap: "0",
  borderBottom: "1px solid #E2E8F0",
  marginBottom: "12px",
};

function getTabStyle(isActive: boolean): CSSProperties {
  return {
    flex: 1,
    padding: "8px 0",
    fontSize: "0.8rem",
    fontWeight: isActive ? 600 : 400,
    color: isActive ? "#3B82F6" : "#64748B",
    backgroundColor: "transparent",
    border: "none",
    borderBottom: isActive ? "2px solid #3B82F6" : "2px solid transparent",
    cursor: "pointer",
    textAlign: "center",
    transition: "color 0.15s, border-color 0.15s",
  };
}

function ValidationContent({ warnings }: { warnings: ValidationWarning[] }) {
  if (warnings.length === 0) {
    return (
      <p style={{ margin: 0, color: "#22C55E", fontSize: "0.8rem", fontWeight: 500 }}>
        未入力の必須項目はありません
      </p>
    );
  }

  return (
    <ul style={{ margin: 0, paddingLeft: "16px", display: "grid", gap: "4px" }}>
      {warnings.map((warning) => (
        <li key={warning.id} style={{ fontSize: "0.8rem", color: "#EF4444" }}>
          <span style={{ fontWeight: 500 }}>{warning.sectionTitle}</span>
          {" — "}
          {warning.fieldLabel}: {warning.message}
        </li>
      ))}
    </ul>
  );
}

function JsonContent({ document, state }: { document: Document; state: DocumentEditorState }) {
  const preview = buildPreview(document, state);

  return (
    <pre
      style={{
        margin: 0,
        maxHeight: "calc(100vh - 260px)",
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
  );
}

export function RightPanel({ document, state, warnings }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("validation");

  return (
    <aside
      style={{
        border: "1px solid #E2E8F0",
        borderRadius: "8px",
        padding: "16px",
        backgroundColor: "#FFFFFF",
        minWidth: 0,
      }}
    >
      <nav style={tabBarStyle}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            style={getTabStyle(activeTab === tab.id)}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "validation" && <ValidationContent warnings={warnings} />}
      {activeTab === "json" && <JsonContent document={document} state={state} />}
      {activeTab === "guide" && <GuidePanel content={guideContent} />}
    </aside>
  );
}
