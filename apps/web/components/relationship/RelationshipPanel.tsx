"use client";

import { useMemo, useState, type CSSProperties } from "react";
import type { Project, Document } from "@specforge/document-schema";

import type {
  DocumentEditorState,
  TableRowValue,
} from "../../lib/document-editor/create-document-state";
import { isReferenceValue, type ReferenceValue } from "../../lib/reference/model";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ScreenApiRelation {
  screenDocId: string;
  screenDocTitle: string;
  apiDocId: string;
  apiDocTitle: string;
  timing: string;
  purpose: string;
  broken: boolean;
}

interface RelationshipPanelProps {
  project: Project;
  documentStates: Record<string, DocumentEditorState>;
  currentDocumentId: string;
  onNavigateToDocument?: (documentId: string, sectionId: string, fieldId: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Extraction helpers                                                 */
/* ------------------------------------------------------------------ */

function extractRelations(
  project: Project,
  documentStates: Record<string, DocumentEditorState>,
): ScreenApiRelation[] {
  const apiDocIds = new Set(
    project.documents.filter((d) => d.kind === "api-spec").map((d) => d.id),
  );
  const docTitleById = Object.fromEntries(
    project.documents.map((d) => [d.id, d.title]),
  );

  const relations: ScreenApiRelation[] = [];

  for (const doc of project.documents) {
    if (doc.kind !== "screen-spec") continue;

    const state = documentStates[doc.id];
    if (!state) continue;

    // Find the api-connections table field
    for (const section of doc.sections) {
      for (const field of section.fields) {
        if (field.valueType !== "table" || field.table?.key !== "api-connections") continue;

        const rows = Array.isArray(state.fieldValues[field.id])
          ? (state.fieldValues[field.id] as TableRowValue[])
          : [];

        for (const row of rows) {
          const apiRef = row.apiRef;
          if (!apiRef || !isReferenceValue(apiRef)) continue;

          const broken = !apiDocIds.has(apiRef.documentId);
          relations.push({
            screenDocId: doc.id,
            screenDocTitle: doc.title,
            apiDocId: apiRef.documentId,
            apiDocTitle: broken ? `(不明: ${apiRef.documentId.slice(0, 8)}...)` : docTitleById[apiRef.documentId] ?? "",
            timing: typeof row.timing === "string" ? row.timing : "",
            purpose: typeof row.purpose === "string" ? row.purpose : "",
            broken,
          });
        }
      }
    }
  }

  return relations;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

const KIND_BADGE: Record<string, { color: string; bg: string; border: string; label: string }> = {
  "screen-spec": { color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", label: "Screen" },
  "api-spec": { color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", label: "API" },
};

function KindBadge({ kind }: { kind: string }) {
  const cfg = KIND_BADGE[kind] ?? { color: "#64748B", bg: "#F8FAFC", border: "#E2E8F0", label: kind };
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

function BrokenBadge() {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: "0.6rem",
        fontWeight: 600,
        color: "#DC2626",
        backgroundColor: "#FEF2F2",
        border: "1px solid #FECACA",
        borderRadius: "4px",
        padding: "0 5px",
        lineHeight: "1.6",
        whiteSpace: "nowrap",
      }}
    >
      参照切れ
    </span>
  );
}

const arrowStyle: CSSProperties = {
  fontSize: "0.75rem",
  color: "#94A3B8",
  flexShrink: 0,
  padding: "0 2px",
};

function RelationCard({
  relation,
  highlight,
  onClickScreen,
  onClickApi,
}: {
  relation: ScreenApiRelation;
  highlight: "screen" | "api" | "none";
  onClickScreen?: () => void;
  onClickApi?: () => void;
}) {
  const bgColor = relation.broken
    ? "#FEF2F2"
    : highlight !== "none"
      ? "#F0F9FF"
      : "#F8FAFC";
  const borderColor = relation.broken
    ? "#FECACA"
    : highlight !== "none"
      ? "#BAE6FD"
      : "#E2E8F0";

  return (
    <div
      style={{
        padding: "8px 10px",
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: "6px",
      }}
    >
      {/* Relationship line */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          flexWrap: "wrap",
        }}
      >
        <KindBadge kind="screen-spec" />
        <span
          role="button"
          tabIndex={0}
          onClick={onClickScreen}
          onKeyDown={(e) => { if (e.key === "Enter") onClickScreen?.(); }}
          style={{
            fontSize: "0.75rem",
            fontWeight: highlight === "screen" ? 700 : 500,
            color: "#0F172A",
            cursor: onClickScreen ? "pointer" : "default",
            textDecoration: onClickScreen ? "underline" : "none",
            textDecorationColor: "#CBD5E1",
          }}
        >
          {relation.screenDocTitle}
        </span>

        <span style={arrowStyle}>→</span>

        <KindBadge kind="api-spec" />
        {relation.broken ? (
          <>
            <span style={{ fontSize: "0.75rem", color: "#94A3B8", fontStyle: "italic" }}>
              {relation.apiDocTitle}
            </span>
            <BrokenBadge />
          </>
        ) : (
          <span
            role="button"
            tabIndex={0}
            onClick={onClickApi}
            onKeyDown={(e) => { if (e.key === "Enter") onClickApi?.(); }}
            style={{
              fontSize: "0.75rem",
              fontWeight: highlight === "api" ? 700 : 500,
              color: "#0F172A",
              cursor: onClickApi ? "pointer" : "default",
              textDecoration: onClickApi ? "underline" : "none",
              textDecorationColor: "#CBD5E1",
            }}
          >
            {relation.apiDocTitle}
          </span>
        )}
      </div>

      {/* Details */}
      {(relation.timing || relation.purpose) && (
        <div style={{ marginTop: "4px", fontSize: "0.68rem", color: "#64748B" }}>
          {relation.timing && (
            <span>
              <span style={{ color: "#94A3B8" }}>タイミング: </span>
              {relation.timing}
            </span>
          )}
          {relation.timing && relation.purpose && <span style={{ color: "#CBD5E1" }}> | </span>}
          {relation.purpose && (
            <span>
              <span style={{ color: "#94A3B8" }}>目的: </span>
              {relation.purpose}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Filter toggle                                                      */
/* ------------------------------------------------------------------ */

type FilterMode = "all" | "current" | "broken";

const FILTER_OPTIONS: { id: FilterMode; label: string }[] = [
  { id: "all", label: "すべて" },
  { id: "current", label: "選択中" },
  { id: "broken", label: "参照切れ" },
];

/* ------------------------------------------------------------------ */
/*  Main panel                                                         */
/* ------------------------------------------------------------------ */

export function RelationshipPanel({
  project,
  documentStates,
  currentDocumentId,
  onNavigateToDocument,
}: RelationshipPanelProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  const allRelations = useMemo(
    () => extractRelations(project, documentStates),
    [project, documentStates],
  );

  const brokenCount = useMemo(
    () => allRelations.filter((r) => r.broken).length,
    [allRelations],
  );

  const filtered = useMemo(() => {
    switch (filterMode) {
      case "current":
        return allRelations.filter(
          (r) => r.screenDocId === currentDocumentId || r.apiDocId === currentDocumentId,
        );
      case "broken":
        return allRelations.filter((r) => r.broken);
      default:
        return allRelations;
    }
  }, [allRelations, filterMode, currentDocumentId]);

  // Group by screen document
  const grouped = useMemo(() => {
    const map = new Map<string, ScreenApiRelation[]>();
    for (const r of filtered) {
      const key = r.screenDocId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    // Sort: current document first
    const entries = Array.from(map.entries());
    entries.sort(([a], [b]) => {
      if (a === currentDocumentId) return -1;
      if (b === currentDocumentId) return 1;
      return 0;
    });
    return entries;
  }, [filtered, currentDocumentId]);

  // Orphan api-specs: api-specs not referenced by any screen-spec
  const orphanApiDocs = useMemo(() => {
    const referencedApiIds = new Set(
      allRelations.filter((r) => !r.broken).map((r) => r.apiDocId),
    );
    return project.documents.filter(
      (d) => d.kind === "api-spec" && !referencedApiIds.has(d.id),
    );
  }, [project.documents, allRelations]);

  const handleNavigate = (docId: string) => {
    const doc = project.documents.find((d) => d.id === docId);
    if (!doc || !onNavigateToDocument) return;
    onNavigateToDocument(docId, doc.sections[0]?.id ?? "", "");
  };

  /* Summary stats */
  const screenCount = project.documents.filter((d) => d.kind === "screen-spec").length;
  const apiCount = project.documents.filter((d) => d.kind === "api-spec").length;

  return (
    <div style={{ maxHeight: "calc(100vh - 320px)", overflow: "auto" }}>
      {/* Summary */}
      <div
        style={{
          padding: "8px 10px",
          backgroundColor: "#F8FAFC",
          border: "1px solid #E2E8F0",
          borderRadius: "6px",
          marginBottom: "10px",
          fontSize: "0.72rem",
          color: "#475569",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <span>
          <KindBadge kind="screen-spec" /> <strong>{screenCount}</strong>
        </span>
        <span>
          <KindBadge kind="api-spec" /> <strong>{apiCount}</strong>
        </span>
        <span>
          接続: <strong>{allRelations.length}</strong>
        </span>
        {brokenCount > 0 && (
          <span style={{ color: "#DC2626", fontWeight: 600 }}>
            参照切れ: {brokenCount}
          </span>
        )}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: "0", marginBottom: "10px" }}>
        {FILTER_OPTIONS.map((opt) => {
          const isActive = filterMode === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setFilterMode(opt.id)}
              style={{
                flex: 1,
                padding: "4px 0",
                fontSize: "0.7rem",
                fontWeight: isActive ? 600 : 400,
                color: isActive
                  ? opt.id === "broken"
                    ? "#DC2626"
                    : "#3B82F6"
                  : "#64748B",
                backgroundColor: "transparent",
                border: "none",
                borderBottom: isActive
                  ? `2px solid ${opt.id === "broken" ? "#DC2626" : "#3B82F6"}`
                  : "2px solid transparent",
                cursor: "pointer",
              }}
            >
              {opt.label}
              {opt.id === "broken" && brokenCount > 0 && (
                <span
                  style={{
                    marginLeft: "3px",
                    fontSize: "0.6rem",
                    fontWeight: 600,
                    color: "#FFFFFF",
                    backgroundColor: "#EF4444",
                    borderRadius: "9999px",
                    padding: "0 4px",
                  }}
                >
                  {brokenCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Relations list */}
      {filtered.length === 0 && orphanApiDocs.length === 0 && (
        <div
          style={{
            padding: "16px",
            textAlign: "center",
            color: "#94A3B8",
            fontSize: "0.78rem",
          }}
        >
          {filterMode === "current"
            ? "選択中のドキュメントに関連する接続はありません"
            : filterMode === "broken"
              ? "参照切れはありません"
              : "Screen → API の接続はまだありません"}
        </div>
      )}

      {grouped.map(([screenDocId, relations]) => (
        <div key={screenDocId} style={{ marginBottom: "10px" }}>
          <div
            style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              color: screenDocId === currentDocumentId ? "#7C3AED" : "#475569",
              marginBottom: "4px",
              paddingLeft: "2px",
            }}
          >
            {relations[0].screenDocTitle}
            {screenDocId === currentDocumentId && (
              <span
                style={{
                  marginLeft: "4px",
                  fontSize: "0.6rem",
                  color: "#3B82F6",
                  backgroundColor: "#DBEAFE",
                  borderRadius: "4px",
                  padding: "0 4px",
                  fontWeight: 500,
                }}
              >
                選択中
              </span>
            )}
          </div>
          <div style={{ display: "grid", gap: "4px" }}>
            {relations.map((rel, i) => {
              const highlight =
                rel.screenDocId === currentDocumentId
                  ? "screen" as const
                  : rel.apiDocId === currentDocumentId
                    ? "api" as const
                    : "none" as const;
              return (
                <RelationCard
                  key={`${rel.screenDocId}-${rel.apiDocId}-${i}`}
                  relation={rel}
                  highlight={highlight}
                  onClickScreen={
                    rel.screenDocId !== currentDocumentId
                      ? () => handleNavigate(rel.screenDocId)
                      : undefined
                  }
                  onClickApi={
                    !rel.broken && rel.apiDocId !== currentDocumentId
                      ? () => handleNavigate(rel.apiDocId)
                      : undefined
                  }
                />
              );
            })}
          </div>
        </div>
      ))}

      {/* Orphan API specs (unreferenced) */}
      {filterMode !== "broken" && orphanApiDocs.length > 0 && (
        <div style={{ marginTop: "12px" }}>
          <div
            style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              color: "#D97706",
              marginBottom: "6px",
              paddingLeft: "2px",
            }}
          >
            未参照の API 仕様書
          </div>
          <div style={{ display: "grid", gap: "4px" }}>
            {orphanApiDocs.map((doc) => (
              <div
                key={doc.id}
                role="button"
                tabIndex={0}
                onClick={() => handleNavigate(doc.id)}
                onKeyDown={(e) => { if (e.key === "Enter") handleNavigate(doc.id); }}
                style={{
                  padding: "6px 10px",
                  backgroundColor: "#FFFBEB",
                  border: "1px solid #FDE68A",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                }}
              >
                <KindBadge kind="api-spec" />
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: doc.id === currentDocumentId ? 700 : 500,
                    color: "#0F172A",
                    flex: 1,
                  }}
                >
                  {doc.title}
                </span>
                <span style={{ fontSize: "0.65rem", color: "#D97706" }}>未参照</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
