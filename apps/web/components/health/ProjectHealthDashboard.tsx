"use client";

import { useMemo, type CSSProperties } from "react";
import type { Project, Document } from "@specforge/document-schema";

import type {
  DocumentEditorState,
  TableRowValue,
} from "../../lib/document-editor/create-document-state";
import type { ProjectValidationResult } from "../../lib/validation/validate-design-quality";
import type { ValidationItem } from "../../types/validation";
import { isReferenceValue } from "../../lib/reference/model";
import { calculateQualityScore } from "../../utils/qualityScore";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ProjectHealthDashboardProps {
  project: Project;
  documentStates: Record<string, DocumentEditorState>;
  projectValidation: ProjectValidationResult;
  allValidationItems: ValidationItem[];
  onNavigateToDocument: (documentId: string, sectionId: string, fieldId: string) => void;
  onBack: () => void;
}

interface DocumentHealthSummary {
  id: string;
  title: string;
  kind: Document["kind"];
  errorCount: number;
  warningCount: number;
  infoCount: number;
  score: number;
  status: "good" | "caution" | "needs-improvement";
  statusLabel: string;
}

interface UnconnectedReference {
  sourceDocId: string;
  sourceDocTitle: string;
  sourceDocKind: Document["kind"];
  type: "broken-ref" | "orphan-api" | "orphan-screen" | "missing-event-target" | "missing-api-connection";
  message: string;
  sectionId?: string;
  fieldId?: string;
  rowIndex?: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const KIND_COLORS: Record<string, { color: string; bg: string; border: string; label: string }> = {
  "screen-spec": { color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", label: "Screen" },
  "api-spec": { color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", label: "API" },
  "er-spec": { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", label: "ER" },
  "business-rule": { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", label: "Rule" },
};

const STATUS_COLORS: Record<string, { color: string; bg: string; border: string; label: string }> = {
  good: { color: "#22C55E", bg: "#F0FDF4", border: "#BBF7D0", label: "良好" },
  caution: { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", label: "注意" },
  "needs-improvement": { color: "#EF4444", bg: "#FEF2F2", border: "#FECACA", label: "要改善" },
};

const REF_TYPE_LABELS: Record<UnconnectedReference["type"], { label: string; color: string; bg: string; border: string }> = {
  "broken-ref": { label: "参照切れ", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  "orphan-api": { label: "未参照", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  "orphan-screen": { label: "未接続", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  "missing-event-target": { label: "対象不明", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  "missing-api-connection": { label: "API未接続", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
};

const sectionTitleStyle: CSSProperties = {
  fontSize: "0.82rem",
  fontWeight: 700,
  color: "#334155",
  margin: "0 0 10px",
};

const cardStyle: CSSProperties = {
  border: "1px solid #E2E8F0",
  borderRadius: "8px",
  padding: "16px",
  backgroundColor: "#FFFFFF",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function computeDocumentHealth(
  project: Project,
  allValidationItems: ValidationItem[],
): DocumentHealthSummary[] {
  return project.documents.map((doc) => {
    const docItems = allValidationItems.filter((item) => item.documentId === doc.id);
    const errorCount = docItems.filter((i) => i.severity === "error").length;
    const warningCount = docItems.filter((i) => i.severity === "warning").length;
    const infoCount = docItems.filter((i) => i.severity === "info").length;
    const scoreResult = calculateQualityScore(docItems);

    return {
      id: doc.id,
      title: doc.title,
      kind: doc.kind,
      errorCount,
      warningCount,
      infoCount,
      score: scoreResult.score,
      status: scoreResult.status,
      statusLabel: scoreResult.statusLabel,
    };
  });
}

function collectUnconnectedReferences(
  project: Project,
  documentStates: Record<string, DocumentEditorState>,
  projectValidation: ProjectValidationResult,
): UnconnectedReference[] {
  const refs: UnconnectedReference[] = [];
  const docById = Object.fromEntries(project.documents.map((d) => [d.id, d]));
  const apiDocIds = new Set(project.documents.filter((d) => d.kind === "api-spec").map((d) => d.id));

  const issuePatterns: { pattern: string; type: UnconnectedReference["type"] }[] = [
    { pattern: ":ref-not-found", type: "broken-ref" },
    { pattern: ":ref-wrong-kind", type: "broken-ref" },
    { pattern: ":event-target-field-not-found", type: "missing-event-target" },
    { pattern: ":api-action-no-ref", type: "missing-api-connection" },
    { pattern: ":message-event-not-found", type: "broken-ref" },
  ];

  for (const issue of projectValidation.issues) {
    for (const { pattern, type } of issuePatterns) {
      if (!issue.id.includes(pattern)) continue;
      const doc = docById[issue.documentId];
      refs.push({
        sourceDocId: issue.documentId,
        sourceDocTitle: doc?.title ?? "",
        sourceDocKind: doc?.kind ?? "screen-spec",
        type,
        message: issue.message,
        sectionId: issue.sectionId,
        fieldId: issue.fieldId,
        rowIndex: issue.rowIndex,
      });
      break;
    }
  }

  // Orphan API specs
  const referencedApiIds = new Set<string>();
  for (const doc of project.documents) {
    if (doc.kind !== "screen-spec") continue;
    const state = documentStates[doc.id];
    if (!state) continue;
    for (const section of doc.sections) {
      for (const field of section.fields) {
        if (field.valueType !== "table" || field.table?.key !== "api-connections") continue;
        const rows = Array.isArray(state.fieldValues[field.id])
          ? (state.fieldValues[field.id] as TableRowValue[])
          : [];
        for (const row of rows) {
          const apiRef = row.apiRef;
          if (apiRef && isReferenceValue(apiRef) && apiDocIds.has(apiRef.documentId)) {
            referencedApiIds.add(apiRef.documentId);
          }
        }
      }
    }
  }
  for (const doc of project.documents) {
    if (doc.kind === "api-spec" && !referencedApiIds.has(doc.id)) {
      refs.push({
        sourceDocId: doc.id,
        sourceDocTitle: doc.title,
        sourceDocKind: doc.kind,
        type: "orphan-api",
        message: "どの画面仕様書からも参照されていません",
      });
    }
  }

  // Orphan screen specs
  if (apiDocIds.size > 0) {
    for (const doc of project.documents) {
      if (doc.kind !== "screen-spec") continue;
      const state = documentStates[doc.id];
      if (!state) continue;
      let hasAnyApiRef = false;
      for (const section of doc.sections) {
        for (const field of section.fields) {
          if (field.valueType !== "table" || field.table?.key !== "api-connections") continue;
          const rows = Array.isArray(state.fieldValues[field.id])
            ? (state.fieldValues[field.id] as TableRowValue[])
            : [];
          for (const row of rows) {
            if (row.apiRef && isReferenceValue(row.apiRef)) {
              hasAnyApiRef = true;
              break;
            }
          }
          if (hasAnyApiRef) break;
        }
        if (hasAnyApiRef) break;
      }
      if (!hasAnyApiRef) {
        refs.push({
          sourceDocId: doc.id,
          sourceDocTitle: doc.title,
          sourceDocKind: doc.kind,
          type: "orphan-screen",
          message: "API仕様書への接続がありません",
        });
      }
    }
  }

  return refs;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function KindBadge({ kind }: { kind: string }) {
  const cfg = KIND_COLORS[kind] ?? { color: "#64748B", bg: "#F8FAFC", border: "#E2E8F0", label: kind };
  return (
    <span style={{ display: "inline-block", fontSize: "0.65rem", fontWeight: 600, color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: "4px", padding: "1px 6px", lineHeight: "1.6", whiteSpace: "nowrap" }}>
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: DocumentHealthSummary["status"] }) {
  const cfg = STATUS_COLORS[status];
  return (
    <span style={{ display: "inline-block", fontSize: "0.65rem", fontWeight: 600, color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: "4px", padding: "1px 6px", lineHeight: "1.6" }}>
      {cfg.label}
    </span>
  );
}

function SummaryStatCard({ value, label, color, activeBg, activeBorder }: {
  value: number; label: string; color: string; activeBg: string; activeBorder: string;
}) {
  const isActive = value > 0;
  return (
    <div style={{ padding: "14px 16px", backgroundColor: isActive ? activeBg : "#F8FAFC", border: `1px solid ${isActive ? activeBorder : "#E2E8F0"}`, borderRadius: "8px", textAlign: "center" }}>
      <div style={{ fontSize: "1.5rem", fontWeight: 700, color: isActive ? color : "#94A3B8", lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: "0.72rem", color: "#64748B", marginTop: "2px" }}>{label}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function ProjectHealthDashboard({
  project,
  documentStates,
  projectValidation,
  allValidationItems,
  onNavigateToDocument,
  onBack,
}: ProjectHealthDashboardProps) {
  const documentHealth = useMemo(
    () => computeDocumentHealth(project, allValidationItems),
    [project, allValidationItems],
  );

  const unconnectedRefs = useMemo(
    () => collectUnconnectedReferences(project, documentStates, projectValidation),
    [project, documentStates, projectValidation],
  );

  const totalErrors = useMemo(() => allValidationItems.filter((i) => i.severity === "error").length, [allValidationItems]);
  const totalWarnings = useMemo(() => allValidationItems.filter((i) => i.severity === "warning").length, [allValidationItems]);
  const totalInfos = useMemo(() => allValidationItems.filter((i) => i.severity === "info").length, [allValidationItems]);
  const projectScore = useMemo(() => calculateQualityScore(allValidationItems), [allValidationItems]);

  const sortedDocs = useMemo(() => {
    return [...documentHealth].sort((a, b) => {
      const aTotal = a.errorCount * 100 + a.warningCount;
      const bTotal = b.errorCount * 100 + b.warningCount;
      return bTotal - aTotal;
    });
  }, [documentHealth]);

  const kindCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const doc of project.documents) {
      counts[doc.kind] = (counts[doc.kind] ?? 0) + 1;
    }
    return counts;
  }, [project.documents]);

  const handleNavigate = (docId: string, sectionId?: string, fieldId?: string) => {
    const doc = project.documents.find((d) => d.id === docId);
    if (!doc) return;
    onNavigateToDocument(docId, sectionId ?? doc.sections[0]?.id ?? "", fieldId ?? "");
  };

  const statusColors = STATUS_COLORS[projectScore.status];

  return (
    <div style={{ minHeight: "calc(100vh - 120px)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              padding: "6px 12px",
              fontSize: "0.78rem",
              fontWeight: 500,
              color: "#3B82F6",
              backgroundColor: "#EFF6FF",
              border: "1px solid #BFDBFE",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            ← エディタに戻る
          </button>
          <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0F172A" }}>
            プロジェクトヘルス — {project.title}
          </h2>
        </div>
        <div style={{
          fontSize: "0.78rem",
          fontWeight: 600,
          color: statusColors.color,
          backgroundColor: statusColors.bg,
          border: `1px solid ${statusColors.border}`,
          borderRadius: "6px",
          padding: "4px 12px",
        }}>
          Score: {projectScore.score} / 100 — {projectScore.statusLabel}
        </div>
      </div>

      {/* Summary stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
        <SummaryStatCard value={project.documents.length} label="ドキュメント数" color="#3B82F6" activeBg="#EFF6FF" activeBorder="#BFDBFE" />
        <SummaryStatCard value={totalErrors} label="Error" color="#DC2626" activeBg="#FEF2F2" activeBorder="#FECACA" />
        <SummaryStatCard value={totalWarnings} label="Warning" color="#D97706" activeBg="#FFFBEB" activeBorder="#FDE68A" />
        <SummaryStatCard value={unconnectedRefs.length} label="未接続参照" color="#EF4444" activeBg="#FEF2F2" activeBorder="#FECACA" />
      </div>

      {/* Kind breakdown bar */}
      <div style={{ ...cardStyle, marginBottom: "20px", padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B" }}>種別内訳:</span>
          {Object.entries(kindCounts).map(([kind, count]) => (
            <span key={kind} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <KindBadge kind={kind} />
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#334155" }}>{count}</span>
            </span>
          ))}
          <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>|</span>
          <span style={{ fontSize: "0.72rem", color: "#64748B" }}>
            Info: <strong style={{ color: "#3B82F6" }}>{totalInfos}</strong>
          </span>
        </div>
      </div>

      {/* Two-column layout: documents + unconnected refs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "16px", alignItems: "start" }}>
        {/* Left: Document status table */}
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>ドキュメント別ステータス</h3>

          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 80px 60px 60px 60px 70px",
            gap: "8px",
            padding: "6px 10px",
            borderBottom: "2px solid #E2E8F0",
            fontSize: "0.68rem",
            fontWeight: 600,
            color: "#64748B",
            textTransform: "uppercase" as const,
            letterSpacing: "0.03em",
          }}>
            <span>ドキュメント</span>
            <span style={{ textAlign: "center" }}>ステータス</span>
            <span style={{ textAlign: "center" }}>Error</span>
            <span style={{ textAlign: "center" }}>Warn</span>
            <span style={{ textAlign: "center" }}>Info</span>
            <span style={{ textAlign: "center" }}>Score</span>
          </div>

          {/* Table rows */}
          {sortedDocs.map((doc) => {
            const rowBg = doc.status === "needs-improvement"
              ? "#FFFBFB"
              : doc.status === "caution"
                ? "#FFFDF7"
                : "transparent";
            return (
              <div
                key={doc.id}
                role="button"
                tabIndex={0}
                onClick={() => handleNavigate(doc.id)}
                onKeyDown={(e) => { if (e.key === "Enter") handleNavigate(doc.id); }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 80px 60px 60px 60px 70px",
                  gap: "8px",
                  padding: "8px 10px",
                  borderBottom: "1px solid #F1F5F9",
                  fontSize: "0.78rem",
                  alignItems: "center",
                  cursor: "pointer",
                  backgroundColor: rowBg,
                  transition: "background-color 0.1s",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                  <KindBadge kind={doc.kind} />
                  <span style={{ fontWeight: 500, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {doc.title}
                  </span>
                </span>
                <span style={{ textAlign: "center" }}>
                  <StatusBadge status={doc.status} />
                </span>
                <span style={{ textAlign: "center", fontWeight: 600, color: doc.errorCount > 0 ? "#DC2626" : "#CBD5E1" }}>
                  {doc.errorCount}
                </span>
                <span style={{ textAlign: "center", fontWeight: 600, color: doc.warningCount > 0 ? "#D97706" : "#CBD5E1" }}>
                  {doc.warningCount}
                </span>
                <span style={{ textAlign: "center", fontWeight: 600, color: doc.infoCount > 0 ? "#3B82F6" : "#CBD5E1" }}>
                  {doc.infoCount}
                </span>
                <span style={{ textAlign: "center" }}>
                  <span style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: STATUS_COLORS[doc.status].color,
                  }}>
                    {doc.score}
                  </span>
                  <span style={{ fontSize: "0.62rem", color: "#94A3B8" }}> /100</span>
                </span>
              </div>
            );
          })}
        </div>

        {/* Right: Unconnected references */}
        <div style={cardStyle}>
          <h3 style={{ ...sectionTitleStyle, display: "flex", alignItems: "center", gap: "8px" }}>
            未接続参照
            {unconnectedRefs.length > 0 && (
              <span style={{
                fontSize: "0.68rem",
                fontWeight: 600,
                color: "#FFFFFF",
                backgroundColor: "#EF4444",
                borderRadius: "9999px",
                padding: "0 7px",
                lineHeight: "1.7",
              }}>
                {unconnectedRefs.length}
              </span>
            )}
          </h3>

          {unconnectedRefs.length === 0 ? (
            <div style={{
              padding: "24px 16px",
              textAlign: "center",
              color: "#22C55E",
              fontSize: "0.82rem",
              backgroundColor: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: "8px",
            }}>
              すべての参照が正常に接続されています
            </div>
          ) : (
            <div style={{ display: "grid", gap: "6px" }}>
              {unconnectedRefs.map((item, i) => {
                const cfg = REF_TYPE_LABELS[item.type];
                return (
                  <div
                    key={`${item.sourceDocId}-${item.type}-${i}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNavigate(item.sourceDocId, item.sectionId, item.fieldId)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleNavigate(item.sourceDocId, item.sectionId, item.fieldId); }}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: cfg.bg,
                      border: `1px solid ${cfg.border}`,
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "opacity 0.1s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                      <span style={{
                        fontSize: "0.62rem",
                        fontWeight: 600,
                        color: cfg.color,
                        backgroundColor: "rgba(255,255,255,0.7)",
                        border: `1px solid ${cfg.border}`,
                        borderRadius: "4px",
                        padding: "0 5px",
                        lineHeight: "1.6",
                      }}>
                        {cfg.label}
                      </span>
                      <KindBadge kind={item.sourceDocKind} />
                      <span style={{
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        color: "#0F172A",
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {item.sourceDocTitle}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#64748B", paddingLeft: "2px" }}>
                      {item.message}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
