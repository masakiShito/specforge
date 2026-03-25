"use client";

import { useMemo, useState, type CSSProperties } from "react";
import type { Document } from "@specforge/document-schema";

import type { DocumentEditorState } from "../lib/document-editor/create-document-state";
import type { ValidationItem } from "../types/validation";
import { calculateQualityScore, type QualityScoreResult } from "../utils/qualityScore";
import { guideContent } from "../data/guide";
import { GuidePanel } from "./guide/GuidePanel";
import { ValidationPanel } from "./validation/ValidationPanel";

interface RightPanelProps {
  document: Document;
  state: DocumentEditorState;
  validationItems: ValidationItem[];
  onNavigateToField?: (sectionId: string, fieldId: string) => void;
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

const SCORE_COLORS: Record<QualityScoreResult["status"], { color: string; bg: string; border: string }> = {
  good: { color: "#22C55E", bg: "#F0FDF4", border: "#BBF7D0" },
  caution: { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  "needs-improvement": { color: "#EF4444", bg: "#FEF2F2", border: "#FECACA" },
};

function QualityScoreDisplay({ items }: { items: ValidationItem[] }) {
  const result = useMemo(() => calculateQualityScore(items), [items]);
  const colors = SCORE_COLORS[result.status];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 12px",
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: "6px",
        marginBottom: "12px",
      }}
    >
      <div>
        <div style={{ fontSize: "0.7rem", color: "#64748B", marginBottom: "2px" }}>Quality Score</div>
        <div style={{ fontSize: "1.1rem", fontWeight: 700, color: colors.color }}>
          {result.score}
          <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "#94A3B8" }}> / 100</span>
        </div>
      </div>
      <div
        style={{
          fontSize: "0.72rem",
          fontWeight: 600,
          color: colors.color,
          backgroundColor: "rgba(255,255,255,0.7)",
          border: `1px solid ${colors.border}`,
          borderRadius: "4px",
          padding: "2px 8px",
        }}
      >
        {result.statusLabel}
      </div>
    </div>
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

export function RightPanel({ document, state, validationItems, onNavigateToField }: RightPanelProps) {
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
      <QualityScoreDisplay items={validationItems} />

      <nav style={tabBarStyle}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            style={getTabStyle(activeTab === tab.id)}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.id === "validation" && validationItems.length > 0 && (
              <span
                style={{
                  marginLeft: "4px",
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  color: "#FFFFFF",
                  backgroundColor: "#EF4444",
                  borderRadius: "9999px",
                  padding: "0 5px",
                }}
              >
                {validationItems.length}
              </span>
            )}
          </button>
        ))}
      </nav>

      {activeTab === "validation" && (
        <ValidationPanel items={validationItems} onNavigate={onNavigateToField} />
      )}
      {activeTab === "json" && <JsonContent document={document} state={state} />}
      {activeTab === "guide" && <GuidePanel content={guideContent} />}
    </aside>
  );
}
