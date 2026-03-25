"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  sampleScreenSpecProject,
  normalizeProjectData,
  type Project,
  type Document,
  type DocumentKind,
} from "@specforge/document-schema";

import {
  createDocumentState,
  type DocumentEditorState,
  type FieldValue,
} from "../lib/document-editor/create-document-state";
import { createDocument } from "../lib/document-editor/create-document";
import { updateFieldValue } from "../lib/document-editor/update-field-value";
import { validateDocument } from "../lib/document-editor/validate-document";
import { validateDesignQuality, validateProjectQuality } from "../lib/validation/validate-design-quality";
import { enrichValidation, convertDesignIssues } from "../utils/enrichValidation";
import { resolveReferenceTarget } from "../lib/reference/helpers";
import type { ReferenceValue } from "../lib/reference/model";
import { SectionForm } from "./section-form";
import { SectionList } from "./section-list";
import { DocumentList } from "./document-list";
import { RightPanel } from "./right-panel";

/**
 * Build initial per-document editor states for all documents in a project.
 */
function createProjectStates(project: Project): Record<string, DocumentEditorState> {
  const states: Record<string, DocumentEditorState> = {};
  for (const doc of project.documents) {
    states[doc.id] = createDocumentState(doc);
  }
  return states;
}

function ensureUniqueDocumentTitle(
  documentId: string,
  requestedTitle: string,
  documents: Document[]
): string {
  const normalized = requestedTitle.trim();
  if (!normalized) return "";

  const used = new Set(
    documents
      .filter((doc) => doc.id !== documentId)
      .map((doc) => doc.title)
  );
  if (!used.has(normalized)) return normalized;

  let suffix = 2;
  while (used.has(`${normalized} ${suffix}`)) {
    suffix += 1;
  }
  return `${normalized} ${suffix}`;
}

interface DocumentEditorProps {
  project?: Project | Document;
}

export function DocumentEditor({ project: projectInput }: DocumentEditorProps) {
  const [projectState, setProjectState] = useState<Project>(() =>
    normalizeProjectData(projectInput ?? sampleScreenSpecProject)
  );

  const documentById = useMemo(
    () => Object.fromEntries(projectState.documents.map((document) => [document.id, document])),
    [projectState.documents]
  );

  // Per-document editor states keyed by document id
  const [documentStates, setDocumentStates] = useState<Record<string, DocumentEditorState>>(
    () => createProjectStates(projectState)
  );

  const [selectedDocumentId, setSelectedDocumentId] = useState<string>(
    projectState.documents[0]?.id ?? ""
  );
  const [selectedSectionIdByDocument, setSelectedSectionIdByDocument] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        projectState.documents.map((document) => [document.id, document.sections[0]?.id ?? ""])
      )
  );
  const [focusFieldId, setFocusFieldId] = useState<string | null>(null);
  const [editingTitleDocId, setEditingTitleDocId] = useState<string | null>(null);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const fallbackDocumentId = projectState.documents[0]?.id ?? "";
  const currentDocument =
    (selectedDocumentId ? documentById[selectedDocumentId] : undefined) ??
    (fallbackDocumentId ? documentById[fallbackDocumentId] : undefined);

  useEffect(() => {
    if (!currentDocument) return;
    if (selectedDocumentId !== currentDocument.id) {
      setSelectedDocumentId(currentDocument.id);
    }
  }, [currentDocument, selectedDocumentId]);

  
  if (!currentDocument) {
    return <main>ドキュメントが存在しません。</main>;
  }

  const currentDocumentState = documentStates[currentDocument.id] ?? createDocumentState(currentDocument);
  const selectedSectionId =
    selectedSectionIdByDocument[currentDocument.id] ??
    currentDocument.sections[0]?.id ??
    "";

  const validation = useMemo(() => validateDocument(currentDocumentState), [currentDocumentState]);
  const designQuality = useMemo(
    () => validateDesignQuality(currentDocumentState, projectState),
    [currentDocumentState, projectState]
  );
  const projectQuality = useMemo(
    () => validateProjectQuality(projectState, documentStates),
    [projectState, documentStates]
  );

  const validationItems = useMemo(() => {
    const nonTableWarnings = validation.warnings.filter(
      (w) => !w.id.includes(":table-empty") && !w.id.includes(":row")
    );
    const basicItems = enrichValidation(nonTableWarnings).map((item) => ({ ...item, documentId: currentDocument.id }));
    const designItems = convertDesignIssues(designQuality.issues);
    return [...basicItems, ...designItems];
  }, [validation.warnings, designQuality.issues, currentDocument.id]);

  const errorFieldIds = useMemo(() => {
    const ids = new Set<string>();
    for (const item of validationItems) {
      if (item.severity === "error") {
        ids.add(item.fieldId);
      }
    }
    return ids;
  }, [validationItems]);

  const cellErrors = useMemo(() => {
    const keys = new Set<string>();
    for (const issue of designQuality.issues) {
      if (issue.severity === "error" && issue.rowIndex !== undefined && issue.columnKey) {
        keys.add(`${issue.fieldId}:row${issue.rowIndex}:${issue.columnKey}`);
      }
    }
    return keys;
  }, [designQuality.issues]);

  const cellWarnings = useMemo(() => {
    const keys = new Set<string>();
    for (const issue of designQuality.issues) {
      if (issue.severity === "warning" && issue.rowIndex !== undefined && issue.columnKey) {
        keys.add(`${issue.fieldId}:row${issue.rowIndex}:${issue.columnKey}`);
      }
    }
    return keys;
  }, [designQuality.issues]);

  const selectedSection =
    currentDocument.sections.find((section) => section.id === selectedSectionId) ?? currentDocument.sections[0];

  const handleFieldValueChange = (fieldId: string, value: FieldValue) => {
    setDocumentStates((prev) => ({
      ...prev,
      [currentDocument.id]: updateFieldValue(
        prev[currentDocument.id] ?? createDocumentState(currentDocument),
        fieldId,
        value
      ),
    }));
  };

  const handleDocumentSelect = useCallback(
    (documentId: string) => {
      if (!documentById[documentId]) return;
      setSelectedDocumentId(documentId);
    },
    [documentById]
  );

  const handleAddDocument = useCallback(
    (kind: DocumentKind) => {
      const newDoc = createDocument(kind, projectState.documents);

      // Update project state
      setProjectState((prev) => ({
        ...prev,
        documents: [...prev.documents, newDoc],
      }));

      // Create editor state for new document
      setDocumentStates((prev) => ({
        ...prev,
        [newDoc.id]: createDocumentState(newDoc),
      }));

      // Initialize section selection for new document
      setSelectedSectionIdByDocument((prev) => ({
        ...prev,
        [newDoc.id]: newDoc.sections[0]?.id ?? "",
      }));

      // Select the new document
      setSelectedDocumentId(newDoc.id);
    },
    [projectState.documents]
  );

  const handleDocumentTitleChange = useCallback(
    (documentId: string, newTitle: string) => {
      const uniqueTitle = ensureUniqueDocumentTitle(documentId, newTitle, projectState.documents);
      if (!uniqueTitle) return;
      const previousTitle = projectState.documents.find((doc) => doc.id === documentId)?.title ?? "";

      setProjectState((prev) => ({
        ...prev,
        documents: prev.documents.map((doc) =>
          doc.id === documentId ? { ...doc, title: uniqueTitle } : doc
        ),
      }));

      // Also update the document reference in editor state
      setDocumentStates((prev) => {
        const nextStates = { ...prev };
        const renamedState = nextStates[documentId];
        if (renamedState) {
          nextStates[documentId] = {
            ...renamedState,
            document: { ...renamedState.document, title: uniqueTitle },
          };
        }

        for (const [stateId, state] of Object.entries(nextStates)) {
          if (state.document.kind !== "screen-spec") continue;

          const apiConnectionsField = state.document.sections
            .find((section) => section.key === "api-connections")
            ?.fields.find((field) => field.key === "api-connections");
          if (!apiConnectionsField) continue;

          const rows = state.fieldValues[apiConnectionsField.id];
          if (!Array.isArray(rows)) continue;

          let changed = false;
          const updatedRows = rows.map((row) => {
            const targetRef = row.targetDocumentId;
            const targetDocumentId =
              typeof targetRef === "object" && targetRef !== null && "documentId" in targetRef
                ? String((targetRef as { documentId: string }).documentId)
                : "";
            const apiName = typeof row.apiName === "string" ? row.apiName : "";
            const shouldSyncName =
              targetDocumentId === documentId &&
              (apiName === "" || (previousTitle !== "" && apiName === previousTitle));

            if (!shouldSyncName) return row;
            changed = true;
            return {
              ...row,
              apiName: uniqueTitle,
            };
          });

          if (!changed) continue;

          nextStates[stateId] = {
            ...state,
            fieldValues: {
              ...state.fieldValues,
              [apiConnectionsField.id]: updatedRows,
            },
          };
        }

        return nextStates;
      });
    },
    [projectState.documents]
  );

  const handleNavigateToField = useCallback(
    (documentId: string, sectionId: string, fieldId: string, rowIndex?: number) => {
      if (documentId !== currentDocument.id) {
        setSelectedDocumentId(documentId);
      }
      if (sectionId !== selectedSectionId || documentId !== currentDocument.id) {
        setSelectedSectionIdByDocument((prev) => ({
          ...prev,
          [documentId]: sectionId,
        }));
      }
      setTimeout(() => {
        setFocusFieldId(fieldId);
      }, 50);
    },
    [selectedSectionId, currentDocument.id]
  );

  const handleFocusHandled = useCallback(() => {
    setFocusFieldId(null);
  }, []);

  const handleNavigateToReference = useCallback((referenceId: string) => {
    const currentState = documentStates[currentDocument.id];
    if (!currentState) return;

    const rows = currentDocument.sections
      .find((section) => section.key === "api-connections")
      ?.fields.find((field) => field.key === "api-connections");
    if (!rows) return;

    const tableRows = currentState.fieldValues[rows.id];
    if (!Array.isArray(tableRows)) return;

    const row = tableRows.find((item) => {
      const cell = item.targetDocumentId;
      return typeof cell === "object" && cell !== null && "refId" in cell && (cell as ReferenceValue).refId === referenceId;
    });

    const reference = row?.targetDocumentId;
    if (typeof reference !== "object" || reference === null || !("refId" in reference)) return;

    const resolved = resolveReferenceTarget(projectState, documentStates, reference as ReferenceValue);
    if (!resolved) return;

    handleNavigateToField(resolved.documentId, resolved.sectionId ?? "", resolved.fieldId ?? "");
  }, [currentDocument.id, currentDocument.sections, documentStates, handleNavigateToField, projectState]);

  return (
    <main
      style={{
        fontFamily: "'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif",
        backgroundColor: "#F1F5F9",
        minHeight: "100vh",
        padding: "24px",
        boxSizing: "border-box" as const,
        maxWidth: "100vw",
        overflow: "hidden",
      }}
    >
      <header style={{ marginBottom: "20px" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#0F172A" }}>
          SpecForge
        </h1>
        <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: "0.875rem" }}>
          スキーマ駆動の構造化設計書エディタ
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr 320px",
          gap: "16px",
          alignItems: "start",
          minWidth: 0,
        }}
      >
        <aside
          style={{
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            padding: "16px",
            backgroundColor: "#FFFFFF",
            minWidth: 0,
          }}
        >
          {/* Project title */}
          <h2
            style={{
              margin: "0 0 12px",
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "#64748B",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Project · {projectState.title}
          </h2>

          {/* Document list */}
          <DocumentList
            documents={projectState.documents}
            selectedDocumentId={selectedDocumentId}
            onSelectDocument={handleDocumentSelect}
            onAddDocument={handleAddDocument}
          />

          {/* Divider */}
          <div
            style={{
              height: "1px",
              backgroundColor: "#E2E8F0",
              margin: "12px 0",
            }}
          />

          {/* Current document info with editable title */}
          {editingTitleDocId === currentDocument.id ? (
            <input
              type="text"
              autoFocus
              defaultValue={currentDocument.title}
              onBlur={(e) => {
                const newTitle = e.target.value.trim();
                if (newTitle && newTitle !== currentDocument.title) {
                  handleDocumentTitleChange(currentDocument.id, newTitle);
                }
                setEditingTitleDocId(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  (e.target as HTMLInputElement).blur();
                } else if (e.key === "Escape") {
                  setEditingTitleDocId(null);
                }
              }}
              style={{
                margin: "0 0 4px",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#0F172A",
                border: "1px solid #3B82F6",
                borderRadius: "4px",
                padding: "2px 6px",
                width: "100%",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          ) : (
            <h3
              style={{
                margin: "0 0 4px",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#0F172A",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
              title="クリックしてタイトルを編集"
              onClick={() => setEditingTitleDocId(currentDocument.id)}
            >
              {currentDocument.title}
              <span style={{ fontSize: "0.7rem", color: "#94A3B8" }}>
                (編集)
              </span>
            </h3>
          )}
          <p style={{ margin: "0 0 12px", color: "#94A3B8", fontSize: "0.75rem" }}>
            種別: {currentDocument.kind}　／　バージョン: {currentDocument.version}
            <br />
            key: {currentDocument.key}
          </p>

          {/* Section list */}
          <SectionList
            sections={currentDocument.sections}
            selectedSectionId={selectedSectionId}
            missingRequiredBySection={validation.missingRequiredBySection}
            issueCountBySection={designQuality.issueCountBySection}
            fieldValues={currentDocumentState.fieldValues}
            onSelectSection={(sectionId) =>
              setSelectedSectionIdByDocument((prev) => ({
                ...prev,
                [currentDocument.id]: sectionId,
              }))
            }
          />
        </aside>

        <section
          key={`center:${currentDocument.id}`}
          style={{
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            padding: "16px",
            backgroundColor: "#FFFFFF",
            minWidth: 0,
          }}
        >
          {selectedSection ? (
            <SectionForm
              section={selectedSection}
              fieldValues={currentDocumentState.fieldValues}
              errorFieldIds={errorFieldIds}
              cellErrors={cellErrors}
              cellWarnings={cellWarnings}
              focusFieldId={focusFieldId}
              fieldRefs={fieldRefs}
              onValueChange={handleFieldValueChange}
              onFocusHandled={handleFocusHandled}
              project={projectState}
              documentStates={documentStates}
              onNavigateToReference={handleNavigateToReference}
            />
          ) : (
            <p style={{ color: "#64748B" }}>セクションが存在しません。</p>
          )}
        </section>

        <RightPanel
          key={`right:${currentDocument.id}`}
          document={currentDocument}
          state={currentDocumentState}
          validationItems={validationItems}
          projectValidation={projectQuality}
          onNavigateToField={handleNavigateToField}
        />
      </div>
    </main>
  );
}
