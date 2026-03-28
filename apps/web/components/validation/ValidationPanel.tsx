"use client";

import { useMemo, type CSSProperties } from "react";
import type { ValidationItem, ValidationSeverity } from "../../types/validation";

interface ValidationPanelProps {
  items: ValidationItem[];
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
  onNavigate,
}: {
  item: ValidationItem;
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
        transition: "background-color 0.15s",
      }}
    >
      {/* Problem */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
        <span style={severityBadgeStyle(item.severity)}>{SEVERITY_CONFIG[item.severity].label}</span>
        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0F172A" }}>
          {item.label ?? item.message}
        </span>
      </div>

      {/* Target */}
      <div style={{ fontSize: "0.75rem", color: "#64748B", marginBottom: "3px" }}>
        <span style={{ color: "#94A3B8" }}>対象：</span>
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
  onNavigate,
}: {
  severity: ValidationSeverity;
  items: ValidationItem[];
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
              <ValidationItemCard key={item.id} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ValidationPanel({ items, onNavigate }: ValidationPanelProps) {
  const grouped = useMemo(() => groupBySeverity(items), [items]);

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
      <SeveritySection severity="error" items={grouped.error} onNavigate={onNavigate} />
      <SeveritySection severity="warning" items={grouped.warning} onNavigate={onNavigate} />
      <SeveritySection severity="info" items={grouped.info} onNavigate={onNavigate} />
    </div>
  );
}
