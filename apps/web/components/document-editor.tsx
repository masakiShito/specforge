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
import { validateDesignQuality } from "../lib/validation/validate-design-quality";
import { enrichValidation, convertDesignIssues } from "../utils/enrichValidation";
import { getApiReferenceOptions } from "../lib/reference/helpers";
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

  // Compute API reference options for the whole project
  const apiReferenceOptions = useMemo(
    () => getApiReferenceOptions(projectState),
    [projectState]
  );

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
  const validationItems = useMemo(() => {
    const nonTableWarnings = validation.warnings.filter(
      (w) => !w.id.includes(":table-empty") && !w.id.includes(":row")
    );
    const basicItems = enrichValidation(nonTableWarnings);
    const designItems = convertDesignIssues(designQuality.issues);
    return [...basicItems, ...designItems];
  }, [validation.warnings, designQuality.issues]);

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
      const newDoc = createDocument(kind);

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
    []
  );

  const handleDocumentTitleChange = useCallback(
    (documentId: string, newTitle: string) => {
      setProjectState((prev) => ({
        ...prev,
        documents: prev.documents.map((doc) =>
          doc.id === documentId ? { ...doc, title: newTitle } : doc
        ),
      }));

      // Also update the document reference in editor state
      setDocumentStates((prev) => {
        const state = prev[documentId];
        if (!state) return prev;
        return {
          ...prev,
          [documentId]: {
            ...state,
            document: { ...state.document, title: newTitle },
          },
        };
      });
    },
    []
  );

  const handleNavigateToField = useCallback(
    (sectionId: string, fieldId: string) => {
      if (sectionId !== selectedSectionId) {
        setSelectedSectionIdByDocument((prev) => ({
          ...prev,
          [currentDocument.id]: sectionId,
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
            {projectState.title}
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
              apiReferenceOptions={apiReferenceOptions}
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
          onNavigateToField={handleNavigateToField}
        />
      </div>
    </main>
  );
}
