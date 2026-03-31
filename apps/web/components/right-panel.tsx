"use client";

import { useMemo, useState, type CSSProperties } from "react";
import type { Document } from "@specforge/document-schema";

import type { Project } from "@specforge/document-schema";

import type { DocumentEditorState } from "../lib/document-editor/create-document-state";
import type { ProjectValidationResult } from "../lib/validation/validate-design-quality";
import type { ValidationItem } from "../types/validation";
import { calculateQualityScore, type QualityScoreResult } from "../utils/qualityScore";
import { getGuideContent } from "../data/guide";
import { GuidePanel } from "./guide/GuidePanel";
import { ValidationPanel } from "./validation/ValidationPanel";
import { RelationshipPanel } from "./relationship/RelationshipPanel";

interface RightPanelProps {
  document: Document;
  state: DocumentEditorState;
  validationItems: ValidationItem[];
  allValidationItems: ValidationItem[];
  projectValidation: ProjectValidationResult;
  project: Project;
  documentStates: Record<string, DocumentEditorState>;
  onNavigateToField?: (documentId: string, sectionId: string, fieldId: string, rowIndex?: number) => void;
}

type TabId = "validation" | "relationship" | "json" | "guide";
const tabs: { id: TabId; label: string }[] = [{ id: "validation", label: "バリデーション" }, { id: "relationship", label: "関係性" }, { id: "json", label: "JSON" }, { id: "guide", label: "ガイド" }];

const tabBarStyle: CSSProperties = { display: "flex", gap: "0", borderBottom: "1px solid #E2E8F0", marginBottom: "12px" };
function getTabStyle(isActive: boolean): CSSProperties { return { flex: 1, padding: "8px 0", fontSize: "0.8rem", fontWeight: isActive ? 600 : 400, color: isActive ? "#3B82F6" : "#64748B", backgroundColor: "transparent", border: "none", borderBottom: isActive ? "2px solid #3B82F6" : "2px solid transparent", cursor: "pointer", textAlign: "center", transition: "color 0.15s, border-color 0.15s" }; }

const SCORE_COLORS: Record<QualityScoreResult["status"], { color: string; bg: string; border: string }> = { good: { color: "#22C55E", bg: "#F0FDF4", border: "#BBF7D0" }, caution: { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" }, "needs-improvement": { color: "#EF4444", bg: "#FEF2F2", border: "#FECACA" } };

function QualityScoreDisplay({ items, projectValidation }: { items: ValidationItem[]; projectValidation: ProjectValidationResult }) {
  const result = useMemo(() => calculateQualityScore(items), [items]);
  const colors = SCORE_COLORS[result.status];
  const projectErrorCount = projectValidation.issues.filter((issue) => issue.severity === "error").length;
  const projectWarningCount = projectValidation.issues.filter((issue) => issue.severity === "warning").length;

  return (
    <div style={{ padding: "10px 12px", backgroundColor: colors.bg, border: `1px solid ${colors.border}`, borderRadius: "6px", marginBottom: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div><div style={{ fontSize: "0.7rem", color: "#64748B", marginBottom: "2px" }}>Quality Score</div><div style={{ fontSize: "1.1rem", fontWeight: 700, color: colors.color }}>{result.score}<span style={{ fontSize: "0.75rem", fontWeight: 400, color: "#94A3B8" }}> / 100</span></div></div>
        <div style={{ fontSize: "0.72rem", fontWeight: 600, color: colors.color, backgroundColor: "rgba(255,255,255,0.7)", border: `1px solid ${colors.border}`, borderRadius: "4px", padding: "2px 8px" }}>{result.statusLabel}</div>
      </div>
      <div style={{ marginTop: "8px", fontSize: "0.72rem", color: "#475569" }}>Project: Error {projectErrorCount} / Warning {projectWarningCount}</div>
    </div>
  );
}

function JsonContent({ document, state }: { document: Document; state: DocumentEditorState }) {
  return <pre style={{ margin: 0, maxHeight: "calc(100vh - 260px)", overflow: "auto", fontSize: "0.72rem", lineHeight: "1.5", backgroundColor: "#1E293B", color: "#E2E8F0", padding: "12px", borderRadius: "6px", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{JSON.stringify({ id: document.id, key: document.key, title: document.title, kind: document.kind, version: document.version, fields: state.fieldValues }, null, 2)}</pre>;
}

export function RightPanel({ document, state, validationItems, allValidationItems, projectValidation, project, documentStates, onNavigateToField }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("validation");

  return (
    <aside style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px", backgroundColor: "#FFFFFF", minWidth: 0 }}>
      <QualityScoreDisplay items={validationItems} projectValidation={projectValidation} />
      <nav style={tabBarStyle}>{tabs.map((tab) => <button key={tab.id} type="button" style={getTabStyle(activeTab === tab.id)} onClick={() => setActiveTab(tab.id)}>{tab.label}{tab.id === "validation" && allValidationItems.length > 0 && <span style={{ marginLeft: "4px", fontSize: "0.65rem", fontWeight: 600, color: "#FFFFFF", backgroundColor: "#EF4444", borderRadius: "9999px", padding: "0 5px" }}>{allValidationItems.length}</span>}</button>)}</nav>
      {activeTab === "validation" && <ValidationPanel items={allValidationItems} currentDocumentId={document.id} onNavigate={onNavigateToField} />}
      {activeTab === "relationship" && <RelationshipPanel project={project} documentStates={documentStates} currentDocumentId={document.id} onNavigateToDocument={onNavigateToField ? (docId, secId, fId) => onNavigateToField(docId, secId, fId) : undefined} />}
      {activeTab === "json" && <JsonContent document={document} state={state} />}
      {activeTab === "guide" && <GuidePanel content={getGuideContent(document.kind)} />}
    </aside>
  );
}
