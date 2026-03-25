"use client";

import { useState } from "react";
import type { Document, DocumentKind } from "@specforge/document-schema";

import { creatableKinds } from "../lib/document-editor/create-document";

const KIND_LABELS: Record<string, string> = {
  "screen-spec": "画面",
  "api-spec": "API",
  "er-spec": "ER",
  "business-rule": "業務",
};

const KIND_COLORS: Record<string, { color: string; bg: string; selectedColor: string; selectedBg: string }> = {
  "screen-spec": { color: "#8B5CF6", bg: "#F5F3FF", selectedColor: "#7C3AED", selectedBg: "#EDE9FE" },
  "api-spec": { color: "#059669", bg: "#ECFDF5", selectedColor: "#047857", selectedBg: "#D1FAE5" },
  "er-spec": { color: "#D97706", bg: "#FFFBEB", selectedColor: "#B45309", selectedBg: "#FEF3C7" },
  "business-rule": { color: "#DC2626", bg: "#FEF2F2", selectedColor: "#B91C1C", selectedBg: "#FECACA" },
};

interface DocumentListProps {
  documents: Document[];
  selectedDocumentId: string;
  onSelectDocument: (documentId: string) => void;
  onAddDocument?: (kind: DocumentKind) => void;
}

export function DocumentList({
  documents,
  selectedDocumentId,
  onSelectDocument,
  onAddDocument,
}: DocumentListProps) {
  const [showKindMenu, setShowKindMenu] = useState(false);

  return (
    <nav aria-label="ドキュメント一覧">
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "4px" }}>
        {documents.map((doc) => {
          const isSelected = doc.id === selectedDocumentId;
          const kindLabel = KIND_LABELS[doc.kind] ?? doc.kind;
          const kindColors = KIND_COLORS[doc.kind] ?? KIND_COLORS["screen-spec"];

          return (
            <li key={doc.id}>
              <button
                type="button"
                onClick={() => onSelectDocument(doc.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: isSelected ? "2px solid #3B82F6" : "1px solid transparent",
                  borderRadius: "6px",
                  padding: "8px 10px",
                  backgroundColor: isSelected ? "#EFF6FF" : "transparent",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "0.6rem",
                    fontWeight: 600,
                    color: isSelected ? kindColors.selectedColor : kindColors.color,
                    backgroundColor: isSelected ? kindColors.selectedBg : kindColors.bg,
                    borderRadius: "3px",
                    padding: "1px 5px",
                    lineHeight: "1.6",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {kindLabel}
                </span>
                <span
                  style={{
                    fontWeight: isSelected ? 600 : 400,
                    fontSize: "0.8rem",
                    color: isSelected ? "#1E40AF" : "#334155",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {doc.title}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Add Document Button */}
      {onAddDocument && (
        <div style={{ position: "relative", marginTop: "8px" }}>
          <button
            type="button"
            onClick={() => setShowKindMenu((prev) => !prev)}
            style={{
              width: "100%",
              padding: "8px 10px",
              fontSize: "0.8rem",
              fontWeight: 500,
              color: "#3B82F6",
              backgroundColor: "transparent",
              border: "1px dashed #93C5FD",
              borderRadius: "6px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            + ドキュメント追加
          </button>

          {showKindMenu && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                marginTop: "4px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "6px",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                zIndex: 10,
                overflow: "hidden",
              }}
            >
              {creatableKinds.map((item) => {
                const kindColors = KIND_COLORS[item.kind] ?? KIND_COLORS["screen-spec"];
                return (
                  <button
                    key={item.kind}
                    type="button"
                    onClick={() => {
                      onAddDocument(item.kind);
                      setShowKindMenu(false);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 12px",
                      fontSize: "0.8rem",
                      color: "#334155",
                      backgroundColor: "transparent",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      borderBottom: "1px solid #F1F5F9",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.6rem",
                        fontWeight: 600,
                        color: kindColors.color,
                        backgroundColor: kindColors.bg,
                        borderRadius: "3px",
                        padding: "1px 5px",
                        lineHeight: "1.6",
                      }}
                    >
                      {KIND_LABELS[item.kind]}
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
