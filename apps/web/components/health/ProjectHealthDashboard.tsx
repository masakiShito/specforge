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
  currentDocumentId: string;
  onNavigateToDocument?: (documentId: string, sectionId: string, fieldId: string) => void;
}

interface DocumentHealthSummary {
  id: string;
  title: string;
  kind: Document["kind"];
  errorCount: number;
  warningCount: number;
  infoCount: number;
  status: "good" | "caution" | "needs-improvement";
}

interface UnconnectedReference {
  sourceDocId: string;
  sourceDocTitle: string;
  type: "broken-ref" | "orphan-api" | "orphan-screen" | "missing-event-target" | "missing-api-connection";
  message: string;
  sectionId?: string;
  fieldId?: string;
  rowIndex?: number;
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const KIND_COLORS: Record<string, { color: string; bg: string; border: string; label: string }> = {
  "screen-spec": { color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", label: "Screen" },
  "api-spec": { color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", label: "API" },
  "er-spec": { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", label: "ER" },
  "business-rule": { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", label: "Rule" },
};

const STATUS_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  good: { color: "#22C55E", bg: "#F0FDF4", border: "#BBF7D0" },
  caution: { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  "needs-improvement": { color: "#EF4444", bg: "#FEF2F2", border: "#FECACA" },
};

const sectionHeadingStyle: CSSProperties = {
  fontSize: "0.72rem",
  fontWeight: 700,
  color: "#475569",
  margin: "0 0 6px",
  paddingLeft: "2px",
  textTransform: "uppercase",
  letterSpacing: "0.03em",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function computeDocumentHealth(
  project: Project,
  allValidationItems: ValidationItem[],
  projectValidation: ProjectValidationResult,
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
      status: scoreResult.status,
    };
  });
}

function collectUnconnectedReferences(
  project: Project,
  documentStates: Record<string, DocumentEditorState>,
  projectValidation: ProjectValidationResult,
): UnconnectedReference[] {
  const refs: UnconnectedReference[] = [];
  const docTitleById = Object.fromEntries(project.documents.map((d) => [d.id, d.title]));
  const apiDocIds = new Set(project.documents.filter((d) => d.kind === "api-spec").map((d) => d.id));

  // 1. Broken API references (from validation issues)
  for (const issue of projectValidation.issues) {
    if (issue.id.includes(":ref-not-found") || issue.id.includes(":ref-wrong-kind")) {
      refs.push({
        sourceDocId: issue.documentId,
        sourceDocTitle: docTitleById[issue.documentId] ?? "",
        type: "broken-ref",
        message: issue.message,
        sectionId: issue.sectionId,
        fieldId: issue.fieldId,
        rowIndex: issue.rowIndex,
      });
    }
  }

  // 2. Unconnected event targets
  for (const issue of projectValidation.issues) {
    if (issue.id.includes(":event-target-field-not-found")) {
      refs.push({
        sourceDocId: issue.documentId,
        sourceDocTitle: docTitleById[issue.documentId] ?? "",
        type: "missing-event-target",
        message: issue.message,
        sectionId: issue.sectionId,
        fieldId: issue.fieldId,
        rowIndex: issue.rowIndex,
      });
    }
  }

  // 3. Missing API connections for API actions
  for (const issue of projectValidation.issues) {
    if (issue.id.includes(":api-action-no-ref")) {
      refs.push({
        sourceDocId: issue.documentId,
        sourceDocTitle: docTitleById[issue.documentId] ?? "",
        type: "missing-api-connection",
        message: issue.message,
        sectionId: issue.sectionId,
        fieldId: issue.fieldId,
        rowIndex: issue.rowIndex,
      });
    }
  }

  // 4. Missing event references from messages
  for (const issue of projectValidation.issues) {
    if (issue.id.includes(":message-event-not-found")) {
      refs.push({
        sourceDocId: issue.documentId,
        sourceDocTitle: docTitleById[issue.documentId] ?? "",
        type: "broken-ref",
        message: issue.message,
        sectionId: issue.sectionId,
        fieldId: issue.fieldId,
        rowIndex: issue.rowIndex,
      });
    }
  }

  // 5. Orphan API specs (not referenced by any screen)
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
        type: "orphan-api",
        message: "どの画面仕様書からも参照されていません",
      });
    }
  }

  // 6. Orphan screen specs (screen-spec with no API connections at all, when API specs exist)
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
    <span
      style={{
        display: "inline-block",
        fontSize: "0.6rem",
        fontWeight: 600,
        color: cfg.color,
        backgroundColor: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: "4px",
        padding: "0 5px",
        lineHeight: "1.6",
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}

function StatusDot({ status }: { status: DocumentHealthSummary["status"] }) {
  const colors = STATUS_COLORS[status];
  return (
    <span
      style={{
        display: "inline-block",
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        backgroundColor: colors.color,
        flexShrink: 0,
      }}
      title={status === "good" ? "良好" : status === "caution" ? "注意" : "要改善"}
    />
  );
}

function CountBadge({ count, color, bg }: { count: number; color: string; bg: string }) {
  if (count === 0) return null;
  return (
    <span
      style={{
        fontSize: "0.62rem",
        fontWeight: 600,
        color,
        backgroundColor: bg,
        borderRadius: "4px",
        padding: "0 4px",
        lineHeight: "1.6",
      }}
    >
      {count}
    </span>
  );
}

function OverviewSummary({
  documents,
  totalErrors,
  totalWarnings,
  totalInfos,
  projectScore,
}: {
  documents: DocumentHealthSummary[];
  totalErrors: number;
  totalWarnings: number;
  totalInfos: number;
  projectScore: ReturnType<typeof calculateQualityScore>;
}) {
  const goodCount = documents.filter((d) => d.status === "good").length;
  const cautionCount = documents.filter((d) => d.status === "caution").length;
  const needsImprovementCount = documents.filter((d) => d.status === "needs-improvement").length;
  const statusColors = STATUS_COLORS[projectScore.status];

  return (
    <div
      style={{
        padding: "10px 12px",
        backgroundColor: statusColors.bg,
        border: `1px solid ${statusColors.border}`,
        borderRadius: "6px",
        marginBottom: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#334155" }}>
          プロジェクト概要
        </div>
        <div
          style={{
            fontSize: "0.68rem",
            fontWeight: 600,
            color: statusColors.color,
            backgroundColor: "rgba(255,255,255,0.7)",
            border: `1px solid ${statusColors.border}`,
            borderRadius: "4px",
            padding: "1px 8px",
          }}
        >
          {projectScore.statusLabel}
        </div>
      </div>

      {/* Doc count row */}
      <div style={{ display: "flex", gap: "10px", fontSize: "0.7rem", color: "#475569", marginBottom: "6px", flexWrap: "wrap" }}>
        <span>ドキュメント: <strong>{documents.length}</strong></span>
        {goodCount > 0 && <span style={{ color: "#22C55E" }}>良好: {goodCount}</span>}
        {cautionCount > 0 && <span style={{ color: "#D97706" }}>注意: {cautionCount}</span>}
        {needsImprovementCount > 0 && <span style={{ color: "#EF4444" }}>要改善: {needsImprovementCount}</span>}
      </div>

      {/* Issue count row */}
      <div style={{ display: "flex", gap: "10px", fontSize: "0.7rem", color: "#475569", flexWrap: "wrap" }}>
        <span style={{ color: "#EF4444", fontWeight: totalErrors > 0 ? 600 : 400 }}>
          Error: {totalErrors}
        </span>
        <span style={{ color: "#D97706", fontWeight: totalWarnings > 0 ? 600 : 400 }}>
          Warning: {totalWarnings}
        </span>
        <span style={{ color: "#3B82F6" }}>
          Info: {totalInfos}
        </span>
      </div>
    </div>
  );
}

function DocumentHealthCard({
  doc,
  isCurrent,
  onClick,
}: {
  doc: DocumentHealthSummary;
  isCurrent: boolean;
  onClick?: () => void;
}) {
  const total = doc.errorCount + doc.warningCount + doc.infoCount;

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter") onClick(); } : undefined}
      style={{
        padding: "8px 10px",
        backgroundColor: isCurrent ? "#F0F9FF" : "#F8FAFC",
        border: `1px solid ${isCurrent ? "#BAE6FD" : "#E2E8F0"}`,
        borderRadius: "6px",
        cursor: onClick ? "pointer" : "default",
        transition: "background-color 0.1s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
        <StatusDot status={doc.status} />
        <KindBadge kind={doc.kind} />
        <span
          style={{
            fontSize: "0.73rem",
            fontWeight: isCurrent ? 700 : 500,
            color: "#0F172A",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {doc.title}
        </span>
        {isCurrent && (
          <span style={{ fontSize: "0.6rem", color: "#3B82F6", backgroundColor: "#DBEAFE", borderRadius: "4px", padding: "0 4px", fontWeight: 500 }}>
            選択中
          </span>
        )}
      </div>

      {total > 0 ? (
        <div style={{ display: "flex", gap: "6px", paddingLeft: "14px" }}>
          <CountBadge count={doc.errorCount} color="#DC2626" bg="#FEF2F2" />
          <CountBadge count={doc.warningCount} color="#D97706" bg="#FFFBEB" />
          <CountBadge count={doc.infoCount} color="#3B82F6" bg="#EFF6FF" />
        </div>
      ) : (
        <div style={{ paddingLeft: "14px", fontSize: "0.65rem", color: "#94A3B8" }}>
          問題なし
        </div>
      )}
    </div>
  );
}

const REF_TYPE_LABELS: Record<UnconnectedReference["type"], { label: string; color: string; bg: string }> = {
  "broken-ref": { label: "参照切れ", color: "#DC2626", bg: "#FEF2F2" },
  "orphan-api": { label: "未参照", color: "#D97706", bg: "#FFFBEB" },
  "orphan-screen": { label: "未接続", color: "#D97706", bg: "#FFFBEB" },
  "missing-event-target": { label: "対象不明", color: "#D97706", bg: "#FFFBEB" },
  "missing-api-connection": { label: "API未接続", color: "#D97706", bg: "#FFFBEB" },
};

function UnconnectedReferenceCard({
  item,
  onClick,
}: {
  item: UnconnectedReference;
  onClick?: () => void;
}) {
  const cfg = REF_TYPE_LABELS[item.type];

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter") onClick(); } : undefined}
      style={{
        padding: "6px 10px",
        backgroundColor: cfg.bg,
        border: `1px solid ${item.type === "broken-ref" ? "#FECACA" : "#FDE68A"}`,
        borderRadius: "6px",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
        <span
          style={{
            fontSize: "0.6rem",
            fontWeight: 600,
            color: cfg.color,
            backgroundColor: "rgba(255,255,255,0.7)",
            border: `1px solid ${item.type === "broken-ref" ? "#FECACA" : "#FDE68A"}`,
            borderRadius: "4px",
            padding: "0 5px",
            lineHeight: "1.6",
          }}
        >
          {cfg.label}
        </span>
        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: 500,
            color: "#0F172A",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.sourceDocTitle}
        </span>
      </div>
      <div style={{ fontSize: "0.67rem", color: "#64748B", paddingLeft: "2px" }}>
        {item.message}
      </div>
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
  currentDocumentId,
  onNavigateToDocument,
}: ProjectHealthDashboardProps) {
  const documentHealth = useMemo(
    () => computeDocumentHealth(project, allValidationItems, projectValidation),
    [project, allValidationItems, projectValidation],
  );

  const unconnectedRefs = useMemo(
    () => collectUnconnectedReferences(project, documentStates, projectValidation),
    [project, documentStates, projectValidation],
  );

  const totalErrors = useMemo(() => allValidationItems.filter((i) => i.severity === "error").length, [allValidationItems]);
  const totalWarnings = useMemo(() => allValidationItems.filter((i) => i.severity === "warning").length, [allValidationItems]);
  const totalInfos = useMemo(() => allValidationItems.filter((i) => i.severity === "info").length, [allValidationItems]);
  const projectScore = useMemo(() => calculateQualityScore(allValidationItems), [allValidationItems]);

  const handleNavigate = (docId: string) => {
    const doc = project.documents.find((d) => d.id === docId);
    if (!doc || !onNavigateToDocument) return;
    onNavigateToDocument(docId, doc.sections[0]?.id ?? "", "");
  };

  // Sort: current doc first, then by error count descending
  const sortedDocs = useMemo(() => {
    return [...documentHealth].sort((a, b) => {
      if (a.id === currentDocumentId) return -1;
      if (b.id === currentDocumentId) return 1;
      const aTotal = a.errorCount * 100 + a.warningCount;
      const bTotal = b.errorCount * 100 + b.warningCount;
      return bTotal - aTotal;
    });
  }, [documentHealth, currentDocumentId]);

  return (
    <div style={{ maxHeight: "calc(100vh - 320px)", overflow: "auto" }}>
      {/* Project overview */}
      <OverviewSummary
        documents={documentHealth}
        totalErrors={totalErrors}
        totalWarnings={totalWarnings}
        totalInfos={totalInfos}
        projectScore={projectScore}
      />

      {/* Document status list */}
      <div style={{ marginBottom: "14px" }}>
        <h4 style={sectionHeadingStyle}>ドキュメント別ステータス</h4>
        <div style={{ display: "grid", gap: "4px" }}>
          {sortedDocs.map((doc) => (
            <DocumentHealthCard
              key={doc.id}
              doc={doc}
              isCurrent={doc.id === currentDocumentId}
              onClick={doc.id !== currentDocumentId ? () => handleNavigate(doc.id) : undefined}
            />
          ))}
        </div>
      </div>

      {/* Error / Warning aggregation */}
      <div style={{ marginBottom: "14px" }}>
        <h4 style={sectionHeadingStyle}>Error / Warning 集計</h4>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "6px",
          }}
        >
          <div
            style={{
              padding: "8px",
              backgroundColor: totalErrors > 0 ? "#FEF2F2" : "#F8FAFC",
              border: `1px solid ${totalErrors > 0 ? "#FECACA" : "#E2E8F0"}`,
              borderRadius: "6px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "1rem", fontWeight: 700, color: totalErrors > 0 ? "#DC2626" : "#94A3B8" }}>
              {totalErrors}
            </div>
            <div style={{ fontSize: "0.62rem", color: "#64748B" }}>Error</div>
          </div>
          <div
            style={{
              padding: "8px",
              backgroundColor: totalWarnings > 0 ? "#FFFBEB" : "#F8FAFC",
              border: `1px solid ${totalWarnings > 0 ? "#FDE68A" : "#E2E8F0"}`,
              borderRadius: "6px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "1rem", fontWeight: 700, color: totalWarnings > 0 ? "#D97706" : "#94A3B8" }}>
              {totalWarnings}
            </div>
            <div style={{ fontSize: "0.62rem", color: "#64748B" }}>Warning</div>
          </div>
          <div
            style={{
              padding: "8px",
              backgroundColor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "6px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "1rem", fontWeight: 700, color: totalInfos > 0 ? "#3B82F6" : "#94A3B8" }}>
              {totalInfos}
            </div>
            <div style={{ fontSize: "0.62rem", color: "#64748B" }}>Info</div>
          </div>
        </div>
      </div>

      {/* Unconnected references */}
      <div>
        <h4 style={sectionHeadingStyle}>
          未接続参照
          {unconnectedRefs.length > 0 && (
            <span
              style={{
                marginLeft: "6px",
                fontSize: "0.62rem",
                fontWeight: 600,
                color: "#FFFFFF",
                backgroundColor: "#EF4444",
                borderRadius: "9999px",
                padding: "0 5px",
                textTransform: "none",
              }}
            >
              {unconnectedRefs.length}
            </span>
          )}
        </h4>

        {unconnectedRefs.length === 0 ? (
          <div
            style={{
              padding: "12px",
              textAlign: "center",
              color: "#22C55E",
              fontSize: "0.72rem",
              backgroundColor: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: "6px",
            }}
          >
            すべての参照が正常に接続されています
          </div>
        ) : (
          <div style={{ display: "grid", gap: "4px" }}>
            {unconnectedRefs.map((ref, i) => (
              <UnconnectedReferenceCard
                key={`${ref.sourceDocId}-${ref.type}-${i}`}
                item={ref}
                onClick={
                  onNavigateToDocument
                    ? () => {
                        const doc = project.documents.find((d) => d.id === ref.sourceDocId);
                        if (!doc) return;
                        onNavigateToDocument(
                          ref.sourceDocId,
                          ref.sectionId ?? doc.sections[0]?.id ?? "",
                          ref.fieldId ?? "",
                        );
                      }
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
