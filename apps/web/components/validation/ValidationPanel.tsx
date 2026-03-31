"use client";

import { useMemo, type CSSProperties } from "react";
import type { ValidationItem, ValidationSeverity } from "../../types/validation";

interface ValidationPanelProps {
  items: ValidationItem[];
  currentDocumentId?: string;
  onNavigate?: (documentId: string, sectionId: string, fieldId: string, rowIndex?: number) => void;
}

const SEVERITY_CONFIG: Record<
  ValidationSeverity,
  { color: string; backgroundColor: string; borderColor: string; label: string }
> = {
  error: {
    color: "#DC2626",
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    label: "Error",
  },
  warning: {
    color: "#D97706",
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
    label: "Warning",
  },
  info: {
    color: "#64748B",
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    label: "Info",
  },
};

interface DocumentGroup {
  documentId: string;
  documentTitle: string;
  isCurrent: boolean;
  items: ValidationItem[];
}

function groupByDocument(items: ValidationItem[], currentDocumentId?: string): DocumentGroup[] {
  const map = new Map<string, DocumentGroup>();

  for (const item of items) {
    const docId = item.documentId ?? "";
    if (!map.has(docId)) {
      map.set(docId, {
        documentId: docId,
        documentTitle: item.documentTitle ?? "",
        isCurrent: docId === currentDocumentId,
        items: [],
      });
    }
    map.get(docId)!.items.push(item);
  }

  // Current document first, then alphabetical
  const groups = Array.from(map.values());
  groups.sort((a, b) => {
    if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
    return a.documentTitle.localeCompare(b.documentTitle);
  });
  return groups;
}

function groupBySeverity(items: ValidationItem[]): Record<ValidationSeverity, ValidationItem[]> {
  const grouped: Record<ValidationSeverity, ValidationItem[]> = {
    error: [],
    warning: [],
    info: [],
  };
  for (const item of items) {
    grouped[item.severity].push(item);
  }
  return grouped;
}

function groupBySection(items: ValidationItem[]): Record<string, ValidationItem[]> {
  const grouped: Record<string, ValidationItem[]> = {};
  for (const item of items) {
    if (!grouped[item.sectionTitle]) {
      grouped[item.sectionTitle] = [];
    }
    grouped[item.sectionTitle].push(item);
  }
  return grouped;
}

const severityBadgeStyle = (severity: ValidationSeverity): CSSProperties => {
  const config = SEVERITY_CONFIG[severity];
  return {
    display: "inline-block",
    fontSize: "0.65rem",
    fontWeight: 600,
    color: config.color,
    backgroundColor: config.backgroundColor,
    border: `1px solid ${config.borderColor}`,
    borderRadius: "4px",
    padding: "0 5px",
    lineHeight: "1.6",
  };
};

function ValidationItemCard({
  item,
  showDocumentName,
  onNavigate,
}: {
  item: ValidationItem;
  showDocumentName?: boolean;
  onNavigate?: (documentId: string, sectionId: string, fieldId: string, rowIndex?: number) => void;
}) {
  const config = SEVERITY_CONFIG[item.severity];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onNavigate?.(item.documentId ?? "", item.sectionId, item.fieldId, item.rowIndex)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onNavigate?.(item.documentId ?? "", item.sectionId, item.fieldId, item.rowIndex);
        }
      }}
      style={{
        padding: "10px 12px",
        borderLeft: `3px solid ${config.borderColor}`,
        backgroundColor: config.backgroundColor,
        borderRadius: "0 6px 6px 0",
        cursor: onNavigate ? "pointer" : "default",
        transition: "opacity 0.15s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.8"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
    >
      {/* Problem */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
        <span style={severityBadgeStyle(item.severity)}>{SEVERITY_CONFIG[item.severity].label}</span>
        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0F172A", flex: 1 }}>
          {item.label ?? item.message}
        </span>
        {onNavigate && (
          <span style={{ fontSize: "0.7rem", color: "#94A3B8", flexShrink: 0 }} aria-hidden="true">→</span>
        )}
      </div>

      {/* Target */}
      <div style={{ fontSize: "0.75rem", color: "#64748B", marginBottom: "3px" }}>
        <span style={{ color: "#94A3B8" }}>対象：</span>
        {showDocumentName && item.documentTitle && (
          <span style={{ fontWeight: 600 }}>{item.documentTitle} &gt; </span>
        )}
        {item.sectionTitle} &gt; {item.fieldLabel}
      </div>

      {/* Reason */}
      {item.reason && (
        <div style={{ fontSize: "0.72rem", color: "#64748B", marginBottom: "3px" }}>
          <span style={{ color: "#94A3B8" }}>理由：</span>
          {item.reason}
        </div>
      )}

      {/* Fix */}
      {item.fix && (
        <div style={{ fontSize: "0.72rem", color: config.color, fontWeight: 500 }}>
          <span style={{ color: "#94A3B8", fontWeight: 400 }}>対応：</span>
          {item.fix}
        </div>
      )}
    </div>
  );
}

function SeveritySection({
  severity,
  items,
  showDocumentName,
  onNavigate,
}: {
  severity: ValidationSeverity;
  items: ValidationItem[];
  showDocumentName?: boolean;
  onNavigate?: (documentId: string, sectionId: string, fieldId: string, rowIndex?: number) => void;
}) {
  if (items.length === 0) return null;

  const config = SEVERITY_CONFIG[severity];
  const bySection = groupBySection(items);

  return (
    <div style={{ marginBottom: "12px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "8px",
        }}
      >
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: config.color,
          }}
        >
          {config.label}
        </span>
        <span
          style={{
            fontSize: "0.7rem",
            fontWeight: 600,
            color: config.color,
            backgroundColor: config.backgroundColor,
            border: `1px solid ${config.borderColor}`,
            borderRadius: "9999px",
            padding: "0 6px",
            lineHeight: "1.5",
          }}
        >
          {items.length}
        </span>
      </div>

      {Object.entries(bySection).map(([sectionTitle, sectionItems]) => (
        <div key={sectionTitle} style={{ marginBottom: "8px" }}>
          <div
            style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              color: "#94A3B8",
              marginBottom: "4px",
              paddingLeft: "4px",
            }}
          >
            {sectionTitle}
          </div>
          <div style={{ display: "grid", gap: "4px" }}>
            {sectionItems.map((item) => (
              <ValidationItemCard key={item.id} item={item} showDocumentName={showDocumentName} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DocumentSection({
  group,
  onNavigate,
  showDocumentHeader,
}: {
  group: DocumentGroup;
  onNavigate?: (documentId: string, sectionId: string, fieldId: string, rowIndex?: number) => void;
  showDocumentHeader: boolean;
}) {
  const grouped = useMemo(() => groupBySeverity(group.items), [group.items]);

  return (
    <div style={{ marginBottom: showDocumentHeader ? "16px" : "0" }}>
      {showDocumentHeader && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "8px",
            padding: "6px 8px",
            backgroundColor: group.isCurrent ? "#EFF6FF" : "#F8FAFC",
            border: `1px solid ${group.isCurrent ? "#BFDBFE" : "#E2E8F0"}`,
            borderRadius: "6px",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: group.isCurrent ? "#1D4ED8" : "#334155",
            }}
          >
            {group.documentTitle}
          </span>
          {group.isCurrent && (
            <span
              style={{
                fontSize: "0.6rem",
                color: "#3B82F6",
                backgroundColor: "#DBEAFE",
                borderRadius: "4px",
                padding: "0 4px",
                lineHeight: "1.6",
              }}
            >
              現在のドキュメント
            </span>
          )}
          <span
            style={{
              marginLeft: "auto",
              fontSize: "0.68rem",
              color: "#94A3B8",
            }}
          >
            {group.items.length} 件
          </span>
        </div>
      )}

      <SeveritySection severity="error" items={grouped.error} onNavigate={onNavigate} />
      <SeveritySection severity="warning" items={grouped.warning} onNavigate={onNavigate} />
      <SeveritySection severity="info" items={grouped.info} onNavigate={onNavigate} />
    </div>
  );
}

export function ValidationPanel({ items, currentDocumentId, onNavigate }: ValidationPanelProps) {
  const documentGroups = useMemo(
    () => groupByDocument(items, currentDocumentId),
    [items, currentDocumentId]
  );
  const hasMultipleDocuments = documentGroups.length > 1;

  if (items.length === 0) {
    return (
      <div
        style={{
          padding: "16px",
          textAlign: "center",
          color: "#22C55E",
          fontSize: "0.8rem",
          fontWeight: 500,
        }}
      >
        すべての必須項目が入力されています
      </div>
    );
  }

  return (
    <div
      style={{
        maxHeight: "calc(100vh - 320px)",
        overflow: "auto",
      }}
    >
      {documentGroups.map((group) => (
        <DocumentSection
          key={group.documentId}
          group={group}
          onNavigate={onNavigate}
          showDocumentHeader={hasMultipleDocuments}
        />
      ))}
    </div>
  );
}
