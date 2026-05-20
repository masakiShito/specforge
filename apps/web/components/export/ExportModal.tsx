"use client";

import { useState, useCallback } from "react";
import type { Project, Document, Field } from "@specforge/document-schema";
import type { DocumentEditorState, TableRowValue } from "../../lib/document-editor/create-document-state";
import {
  exportProjectToJson,
  exportDocumentToJson,
  exportDocumentToMarkdown,
  exportTableToCsv,
  generateProjectFilename,
  generateDocumentFilename,
  generateMarkdownFilename,
  generateCsvFilename,
  downloadAsJson,
  downloadAsMarkdown,
  downloadAsCsv,
} from "../../lib/export";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  documentStates: Record<string, DocumentEditorState>;
  currentDocumentId?: string;
}

type ExportTarget = "project" | "document" | "table";
type ExportFormat = "json" | "markdown" | "csv";

interface TableInfo {
  documentId: string;
  documentTitle: string;
  sectionKey: string;
  fieldId: string;
  fieldLabel: string;
  columns: Field[];
  rows: TableRowValue[];
}

export function ExportModal({
  isOpen,
  onClose,
  project,
  documentStates,
  currentDocumentId,
}: ExportModalProps) {
  const [target, setTarget] = useState<ExportTarget>("project");
  const [format, setFormat] = useState<ExportFormat>("json");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>(
    currentDocumentId ?? project.documents[0]?.id ?? ""
  );
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Collect all tables from all documents
  const tables: TableInfo[] = [];
  for (const doc of project.documents) {
    const state = documentStates[doc.id];
    if (!state) continue;

    for (const section of doc.sections) {
      for (const field of section.fields) {
        if (field.valueType === "table" && field.table) {
          const rows = state.fieldValues[field.id] as TableRowValue[] | undefined;
          if (rows && rows.length > 0) {
            tables.push({
              documentId: doc.id,
              documentTitle: doc.title,
              sectionKey: section.key,
              fieldId: field.id,
              fieldLabel: field.label,
              columns: field.table.columns,
              rows,
            });
          }
        }
      }
    }
  }

  const handleExport = useCallback(() => {
    setError(null);
    setIsExporting(true);

    try {
      if (target === "project") {
        const states = Object.values(documentStates);
        const result = exportProjectToJson(project, states);

        if (!result.success) {
          setError(result.error);
          return;
        }

        const filename = generateProjectFilename(project);
        downloadAsJson(result.data, filename);
      } else if (target === "document") {
        const doc = project.documents.find((d) => d.id === selectedDocumentId);
        const state = documentStates[selectedDocumentId];

        if (!doc || !state) {
          setError("Document not found");
          return;
        }

        if (format === "json") {
          const result = exportDocumentToJson(doc, state.fieldValues);
          if (!result.success) {
            setError(result.error);
            return;
          }
          const filename = generateDocumentFilename(doc);
          downloadAsJson(result.data, filename);
        } else if (format === "markdown") {
          const result = exportDocumentToMarkdown(doc, state.fieldValues);
          if (!result.success) {
            setError(result.error);
            return;
          }
          const filename = generateMarkdownFilename(doc);
          downloadAsMarkdown(result.data, filename);
        }
      } else if (target === "table") {
        const tableInfo = tables.find((t) => t.fieldId === selectedTableId);
        if (!tableInfo) {
          setError("Table not found");
          return;
        }

        const result = exportTableToCsv(
          tableInfo.fieldLabel,
          tableInfo.columns,
          tableInfo.rows
        );

        if (!result.success) {
          setError(result.error);
          return;
        }

        const filename = generateCsvFilename(tableInfo.fieldLabel, tableInfo.documentTitle);
        downloadAsCsv(result.data, filename);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsExporting(false);
    }
  }, [target, format, project, documentStates, selectedDocumentId, selectedTableId, tables, onClose]);

  if (!isOpen) return null;

  const selectedDocument = project.documents.find((d) => d.id === selectedDocumentId);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          padding: "24px",
          width: "480px",
          maxWidth: "90vw",
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: "0 0 20px", fontSize: "1.25rem", fontWeight: 600, color: "#0F172A" }}>
          エクスポート
        </h2>

        {/* Export Target */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", fontWeight: 500, color: "#475569" }}>
            エクスポート対象
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            {[
              { value: "project", label: "プロジェクト全体" },
              { value: "document", label: "ドキュメント" },
              { value: "table", label: "テーブル" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setTarget(option.value as ExportTarget);
                  if (option.value === "project") setFormat("json");
                  if (option.value === "table") setFormat("csv");
                }}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  color: target === option.value ? "#FFFFFF" : "#475569",
                  backgroundColor: target === option.value ? "#3B82F6" : "#F1F5F9",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Document Selection */}
        {target === "document" && (
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", fontWeight: 500, color: "#475569" }}>
              ドキュメント選択
            </label>
            <select
              value={selectedDocumentId}
              onChange={(e) => setSelectedDocumentId(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: "0.875rem",
                border: "1px solid #E2E8F0",
                borderRadius: "6px",
                backgroundColor: "#FFFFFF",
              }}
            >
              {project.documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Table Selection */}
        {target === "table" && (
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", fontWeight: 500, color: "#475569" }}>
              テーブル選択
            </label>
            {tables.length === 0 ? (
              <p style={{ fontSize: "0.875rem", color: "#94A3B8" }}>
                エクスポート可能なテーブルがありません
              </p>
            ) : (
              <select
                value={selectedTableId}
                onChange={(e) => setSelectedTableId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "0.875rem",
                  border: "1px solid #E2E8F0",
                  borderRadius: "6px",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <option value="">選択してください</option>
                {tables.map((table) => (
                  <option key={table.fieldId} value={table.fieldId}>
                    {table.documentTitle} - {table.fieldLabel} ({table.rows.length}行)
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Format Selection */}
        {target !== "table" && (
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", fontWeight: 500, color: "#475569" }}>
              フォーマット
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              {target === "project" ? (
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    color: "#FFFFFF",
                    backgroundColor: "#3B82F6",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  JSON
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setFormat("json")}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      fontSize: "0.8rem",
                      fontWeight: 500,
                      color: format === "json" ? "#FFFFFF" : "#475569",
                      backgroundColor: format === "json" ? "#3B82F6" : "#F1F5F9",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat("markdown")}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      fontSize: "0.8rem",
                      fontWeight: 500,
                      color: format === "markdown" ? "#FFFFFF" : "#475569",
                      backgroundColor: format === "markdown" ? "#3B82F6" : "#F1F5F9",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    Markdown
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Preview Info */}
        <div
          style={{
            padding: "12px",
            backgroundColor: "#F8FAFC",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748B" }}>
            {target === "project" && (
              <>
                プロジェクト「{project.title}」を JSON 形式でエクスポートします。
                <br />
                {Object.keys(documentStates).length} 個のドキュメントが含まれます。
              </>
            )}
            {target === "document" && selectedDocument && (
              <>
                ドキュメント「{selectedDocument.title}」を {format.toUpperCase()} 形式でエクスポートします。
              </>
            )}
            {target === "table" && (
              <>
                選択したテーブルを CSV 形式でエクスポートします。
              </>
            )}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: "12px",
              backgroundColor: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: "8px",
              marginBottom: "16px",
            }}
          >
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#DC2626" }}>{error}</p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#475569",
              backgroundColor: "#F1F5F9",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || (target === "table" && !selectedTableId)}
            style={{
              padding: "8px 16px",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#FFFFFF",
              backgroundColor: isExporting || (target === "table" && !selectedTableId) ? "#94A3B8" : "#3B82F6",
              border: "none",
              borderRadius: "6px",
              cursor: isExporting || (target === "table" && !selectedTableId) ? "not-allowed" : "pointer",
            }}
          >
            {isExporting ? "エクスポート中..." : "エクスポート"}
          </button>
        </div>
      </div>
    </div>
  );
}
