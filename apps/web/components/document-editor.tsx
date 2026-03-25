"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  sampleScreenSpecProject,
  normalizeProjectData,
  type Project,
  type Document,
} from "@specforge/document-schema";

import {
  createDocumentState,
  type DocumentEditorState,
  type FieldValue,
} from "../lib/document-editor/create-document-state";
import { updateFieldValue } from "../lib/document-editor/update-field-value";
import { validateDocument } from "../lib/document-editor/validate-document";
import { validateDesignQuality } from "../lib/validation/validate-design-quality";
import { enrichValidation, convertDesignIssues } from "../utils/enrichValidation";
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
  const project = useMemo(
    () => normalizeProjectData(projectInput ?? sampleScreenSpecProject),
    [projectInput]
  );

  // Per-document editor states keyed by document id
  const [documentStates, setDocumentStates] = useState<Record<string, DocumentEditorState>>(
    () => createProjectStates(project)
  );

  const [selectedDocumentId, setSelectedDocumentId] = useState<string>(
    project.documents[0]?.id ?? ""
  );
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    project.documents[0]?.sections[0]?.id ?? ""
  );
  const [focusFieldId, setFocusFieldId] = useState<string | null>(null);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  // Track last selected section per document for restoration
  const lastSectionByDocument = useRef<Record<string, string>>({});

  const currentDocument = project.documents.find((d) => d.id === selectedDocumentId) ?? project.documents[0];
  const state = documentStates[currentDocument.id] ?? createDocumentState(currentDocument);

  const validation = useMemo(() => validateDocument(state), [state]);
  const designQuality = useMemo(() => validateDesignQuality(state), [state]);
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
    state.document.sections.find((section) => section.id === selectedSectionId) ?? state.document.sections[0];

  const handleFieldValueChange = (fieldId: string, value: FieldValue) => {
    setDocumentStates((prev) => ({
      ...prev,
      [currentDocument.id]: updateFieldValue(prev[currentDocument.id], fieldId, value),
    }));
  };

  const handleDocumentSelect = useCallback(
    (documentId: string) => {
      // Save current section for the current document
      lastSectionByDocument.current[selectedDocumentId] = selectedSectionId;

      setSelectedDocumentId(documentId);

      // Restore last selected section, or default to the first section
      const targetDoc = project.documents.find((d) => d.id === documentId);
      if (targetDoc) {
        const lastSection = lastSectionByDocument.current[documentId];
        const validSection = lastSection && targetDoc.sections.some((s) => s.id === lastSection);
        setSelectedSectionId(validSection ? lastSection : targetDoc.sections[0]?.id ?? "");
      }
    },
    [selectedDocumentId, selectedSectionId, project.documents]
  );

  const handleNavigateToField = useCallback(
    (sectionId: string, fieldId: string) => {
      if (sectionId !== selectedSectionId) {
        setSelectedSectionId(sectionId);
      }
      setTimeout(() => {
        setFocusFieldId(fieldId);
      }, 50);
    },
    [selectedSectionId]
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
            {project.title}
          </h2>

          {/* Document list */}
          <DocumentList
            documents={project.documents}
            selectedDocumentId={selectedDocumentId}
            onSelectDocument={handleDocumentSelect}
          />

          {/* Divider */}
          <div
            style={{
              height: "1px",
              backgroundColor: "#E2E8F0",
              margin: "12px 0",
            }}
          />

          {/* Current document info */}
          <h3 style={{ margin: "0 0 4px", fontSize: "0.875rem", fontWeight: 600, color: "#0F172A" }}>
            {currentDocument.title}
          </h3>
          <p style={{ margin: "0 0 12px", color: "#94A3B8", fontSize: "0.75rem" }}>
            種別: {currentDocument.kind}　／　バージョン: {currentDocument.version}
          </p>

          {/* Section list */}
          <SectionList
            sections={state.document.sections}
            selectedSectionId={selectedSectionId}
            missingRequiredBySection={validation.missingRequiredBySection}
            issueCountBySection={designQuality.issueCountBySection}
            fieldValues={state.fieldValues}
            onSelectSection={setSelectedSectionId}
          />
        </aside>

        <section
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
              fieldValues={state.fieldValues}
              errorFieldIds={errorFieldIds}
              cellErrors={cellErrors}
              cellWarnings={cellWarnings}
              focusFieldId={focusFieldId}
              fieldRefs={fieldRefs}
              onValueChange={handleFieldValueChange}
              onFocusHandled={handleFocusHandled}
            />
          ) : (
            <p style={{ color: "#64748B" }}>セクションが存在しません。</p>
          )}
        </section>

        <RightPanel
          document={state.document}
          state={state}
          validationItems={validationItems}
          onNavigateToField={handleNavigateToField}
        />
      </div>
    </main>
  );
}
