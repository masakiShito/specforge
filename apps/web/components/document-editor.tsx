"use client";

import { useMemo, useState } from "react";
import { sampleScreenSpecProject, type Document } from "@specforge/document-schema";

import {
  createDocumentState,
  type DocumentEditorState,
  type FieldValue
} from "../lib/document-editor/create-document-state";
import { updateFieldValue } from "../lib/document-editor/update-field-value";
import { validateDocument } from "../lib/document-editor/validate-document";
import { SectionForm } from "./section-form";
import { SectionList } from "./section-list";
import { ValidationPanel } from "./validation-panel";

function resolveInitialDocument(): Document {
  return sampleScreenSpecProject.documents[0];
}

export function DocumentEditor() {
  const initialDocument = resolveInitialDocument();

  const [state, setState] = useState<DocumentEditorState>(() => createDocumentState(initialDocument));
  const [selectedSectionId, setSelectedSectionId] = useState<string>(initialDocument.sections[0]?.id ?? "");

  const validation = useMemo(() => validateDocument(state), [state]);

  const selectedSection =
    state.document.sections.find((section) => section.id === selectedSectionId) ?? state.document.sections[0];

  const handleFieldValueChange = (fieldId: string, value: FieldValue) => {
    setState((current) => updateFieldValue(current, fieldId, value));
  };

  return (
    <main style={{ fontFamily: "sans-serif", backgroundColor: "#F8FAFC", minHeight: "100vh", padding: "18px" }}>
      <header style={{ marginBottom: "14px" }}>
        <h1 style={{ margin: 0 }}>SpecForge Structured Document Editor</h1>
        <p style={{ margin: "8px 0 0", color: "#475569" }}>
          Markdown ではなく、schema 駆動で設計書構造を編集する最小エディタ
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px minmax(420px, 1fr) 420px",
          gap: "14px",
          alignItems: "start"
        }}
      >
        <aside style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "12px", backgroundColor: "#FFFFFF" }}>
          <h2 style={{ marginTop: 0, marginBottom: "8px", fontSize: "1.1rem" }}>{state.document.title}</h2>
          <p style={{ margin: "0 0 12px", color: "#64748B", fontSize: "0.86rem" }}>
            kind: {state.document.kind} / version: {state.document.version}
          </p>
          <SectionList
            sections={state.document.sections}
            selectedSectionId={selectedSectionId}
            missingRequiredBySection={validation.missingRequiredBySection}
            onSelectSection={setSelectedSectionId}
          />
        </aside>

        <section style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "12px", backgroundColor: "#FFFFFF" }}>
          {selectedSection ? (
            <SectionForm section={selectedSection} fieldValues={state.fieldValues} onValueChange={handleFieldValueChange} />
          ) : (
            <p>セクションが存在しません。</p>
          )}
        </section>

        <ValidationPanel document={state.document} state={state} warnings={validation.warnings} />
      </div>
    </main>
  );
}
