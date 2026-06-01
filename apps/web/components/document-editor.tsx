'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  sampleScreenSpecProject,
  normalizeProjectData,
  type Project,
  type Document,
  type DocumentKind,
} from '@specforge/document-schema';

import {
  createDocumentState,
  type DocumentEditorState,
  type FieldValue,
} from '../lib/document-editor/create-document-state';
import { createDocument } from '../lib/document-editor/create-document';
import { updateFieldValue } from '../lib/document-editor/update-field-value';
import { validateDocument } from '../lib/document-editor/validate-document';
import {
  validateDesignQuality,
  validateProjectQuality,
} from '../lib/validation/validate-design-quality';
import { enrichValidation, convertDesignIssues } from '../utils/enrichValidation';

import { SectionForm } from './section-form';
import { SectionList } from './section-list';
import { DocumentList } from './document-list';
import { RightPanel } from './right-panel';
import { DocumentPreview } from './document-preview';
import { ProjectHealthDashboard } from './health/ProjectHealthDashboard';
import { ExportModal, ImportModal } from './export';
import { UserMenu } from './auth';

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
  if (!normalized) return '';

  const used = new Set(documents.filter((doc) => doc.id !== documentId).map((doc) => doc.title));
  if (!used.has(normalized)) return normalized;

  let suffix = 2;
  while (used.has(`${normalized} ${suffix}`)) {
    suffix += 1;
  }
  return `${normalized} ${suffix}`;
}

interface DocumentEditorProps {
  project?: Project | Document;
  // Callback props for sync with external storage
  onFieldValueChange?: (documentId: string, fieldId: string, value: FieldValue) => void;
  onAddDocument?: (kind: DocumentKind) => Promise<void>;
  onDeleteDocument?: (documentId: string) => Promise<void>;
  onDocumentTitleChange?: (documentId: string, newTitle: string) => Promise<void>;
  onProjectTitleChange?: (newTitle: string) => Promise<void>;
  isSaving?: boolean;
  // Optional external state
  externalProject?: Project;
  externalDocumentStates?: Record<string, DocumentEditorState>;
  setExternalProject?: React.Dispatch<React.SetStateAction<Project | null>>;
  setExternalDocumentStates?: React.Dispatch<
    React.SetStateAction<Record<string, DocumentEditorState>>
  >;
}

export function DocumentEditor({
  project: projectInput,
  onFieldValueChange,
  onAddDocument,
  onDeleteDocument,
  onDocumentTitleChange,
  onProjectTitleChange,
  isSaving = false,
  externalProject,
  externalDocumentStates,
  setExternalProject,
  setExternalDocumentStates,
}: DocumentEditorProps) {
  // Use external state if provided, otherwise use internal state
  const useExternal = externalProject !== undefined && externalDocumentStates !== undefined;

  const [internalProjectState, setInternalProjectState] = useState<Project>(() =>
    normalizeProjectData(projectInput ?? sampleScreenSpecProject)
  );

  // Determine which state to use
  const projectState = useExternal ? externalProject : internalProjectState;
  const setProjectState =
    useExternal && setExternalProject
      ? (setExternalProject as React.Dispatch<React.SetStateAction<Project>>)
      : setInternalProjectState;

  const documentById = useMemo(
    () => Object.fromEntries(projectState.documents.map((document) => [document.id, document])),
    [projectState.documents]
  );

  // Per-document editor states keyed by document id
  const [internalDocumentStates, setInternalDocumentStates] = useState<
    Record<string, DocumentEditorState>
  >(() => createProjectStates(projectState));

  // Use external document states if provided
  const documentStates = useExternal ? externalDocumentStates : internalDocumentStates;
  const setDocumentStates =
    useExternal && setExternalDocumentStates
      ? setExternalDocumentStates
      : setInternalDocumentStates;

  const [selectedDocumentId, setSelectedDocumentId] = useState<string>(
    projectState.documents[0]?.id ?? ''
  );
  const [selectedSectionIdByDocument, setSelectedSectionIdByDocument] = useState<
    Record<string, string>
  >(() =>
    Object.fromEntries(
      projectState.documents.map((document) => [document.id, document.sections[0]?.id ?? ''])
    )
  );
  const [focusFieldId, setFocusFieldId] = useState<string | null>(null);
  const [editingTitleDocId, setEditingTitleDocId] = useState<string | null>(null);
  const [editingProjectTitle, setEditingProjectTitle] = useState(false);
  const [centerMode, setCenterMode] = useState<'edit' | 'preview'>('edit');
  const [viewMode, setViewMode] = useState<'editor' | 'health'>('editor');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const fallbackDocumentId = projectState.documents[0]?.id ?? '';
  const currentDocument =
    (selectedDocumentId ? documentById[selectedDocumentId] : undefined) ??
    (fallbackDocumentId ? documentById[fallbackDocumentId] : undefined);

  // Track previous document count to detect additions
  const prevDocCountRef = useRef(projectState.documents.length);

  useEffect(() => {
    const currentCount = projectState.documents.length;
    const prevCount = prevDocCountRef.current;

    // When a document is added (count increased), select the latest one
    if (currentCount > prevCount && currentCount > 0) {
      const latestDoc = projectState.documents[currentCount - 1];
      if (latestDoc) {
        setSelectedDocumentId(latestDoc.id);
        setSelectedSectionIdByDocument((prev) => ({
          ...prev,
          [latestDoc.id]: latestDoc.sections[0]?.id ?? '',
        }));
      }
    }

    prevDocCountRef.current = currentCount;
  }, [projectState.documents]);

  useEffect(() => {
    if (!currentDocument) return;
    if (selectedDocumentId !== currentDocument.id) {
      setSelectedDocumentId(currentDocument.id);
    }
  }, [currentDocument, selectedDocumentId]);

  // Note: "no documents" check is handled after handlers are defined
  // Provide safe defaults when there are no documents
  const currentDocumentState = currentDocument
    ? (documentStates[currentDocument.id] ?? createDocumentState(currentDocument))
    : { document: null as unknown as Document, fieldValues: {} };

  const selectedSectionId = currentDocument
    ? (selectedSectionIdByDocument[currentDocument.id] ?? currentDocument.sections[0]?.id ?? '')
    : '';

  const validation = useMemo(
    () =>
      currentDocument
        ? validateDocument(currentDocumentState)
        : { errors: [], warnings: [], missingRequiredBySection: {} },
    [currentDocument, currentDocumentState]
  );
  const designQuality = useMemo(
    () =>
      currentDocument
        ? validateDesignQuality(currentDocumentState, projectState)
        : { issues: [], issueCountBySection: {} },
    [currentDocument, currentDocumentState, projectState]
  );
  const projectQuality = useMemo(
    () => validateProjectQuality(projectState, documentStates),
    [projectState, documentStates]
  );

  const validationItems = useMemo(() => {
    if (!currentDocument) return [];
    const nonTableWarnings = validation.warnings.filter(
      (w) => !w.id.includes(':table-empty') && !w.id.includes(':row')
    );
    const basicItems = enrichValidation(nonTableWarnings).map((item) => ({
      ...item,
      documentId: currentDocument.id,
    }));
    const designItems = convertDesignIssues(designQuality.issues);
    return [...basicItems, ...designItems];
  }, [validation.warnings, designQuality.issues, currentDocument]);

  // All-document validation items for the panel (enables cross-document navigation)
  const allValidationItems = useMemo(() => {
    const items: import('../types/validation').ValidationItem[] = [];

    for (const doc of projectState.documents) {
      const state = documentStates[doc.id];
      if (!state) continue;

      // Basic required-field validation
      const docValidation = validateDocument(state);
      const nonTableWarnings = docValidation.warnings.filter(
        (w) => !w.id.includes(':table-empty') && !w.id.includes(':row')
      );
      const basicItems = enrichValidation(nonTableWarnings).map((item) => ({
        ...item,
        documentId: doc.id,
        documentTitle: doc.title,
      }));
      items.push(...basicItems);
    }

    // Project-level design quality issues (already cover all documents)
    const designItems = convertDesignIssues(projectQuality.issues).map((item) => ({
      ...item,
      documentTitle: documentById[item.documentId ?? '']?.title ?? '',
    }));
    items.push(...designItems);

    return items;
  }, [projectState.documents, documentStates, projectQuality.issues, documentById]);

  const errorFieldIds = useMemo(() => {
    const ids = new Set<string>();
    for (const item of validationItems) {
      if (item.severity === 'error') {
        ids.add(item.fieldId);
      }
    }
    return ids;
  }, [validationItems]);

  const cellErrors = useMemo(() => {
    const keys = new Set<string>();
    for (const issue of designQuality.issues) {
      if (issue.severity === 'error' && issue.rowIndex !== undefined && issue.columnKey) {
        keys.add(`${issue.fieldId}:row${issue.rowIndex}:${issue.columnKey}`);
      }
    }
    return keys;
  }, [designQuality.issues]);

  const cellWarnings = useMemo(() => {
    const keys = new Set<string>();
    for (const issue of designQuality.issues) {
      if (issue.severity === 'warning' && issue.rowIndex !== undefined && issue.columnKey) {
        keys.add(`${issue.fieldId}:row${issue.rowIndex}:${issue.columnKey}`);
      }
    }
    return keys;
  }, [designQuality.issues]);

  const selectedSection = currentDocument
    ? (currentDocument.sections.find((section) => section.id === selectedSectionId) ??
      currentDocument.sections[0])
    : undefined;

  const handleFieldValueChange = (fieldId: string, value: FieldValue) => {
    if (!currentDocument) return;
    setDocumentStates((prev) => ({
      ...prev,
      [currentDocument.id]: updateFieldValue(
        prev[currentDocument.id] ?? createDocumentState(currentDocument),
        fieldId,
        value
      ),
    }));
    // Call external callback if provided
    if (onFieldValueChange) {
      onFieldValueChange(currentDocument.id, fieldId, value);
    }
  };

  const handleDocumentSelect = useCallback(
    (documentId: string) => {
      if (!documentById[documentId]) return;
      setSelectedDocumentId(documentId);
    },
    [documentById]
  );

  const handleAddDocument = useCallback(
    async (kind: DocumentKind) => {
      // If external callback is provided, use it instead of local state management
      if (onAddDocument) {
        await onAddDocument(kind);
        return;
      }

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
        [newDoc.id]: newDoc.sections[0]?.id ?? '',
      }));

      // Select the new document
      setSelectedDocumentId(newDoc.id);
    },
    [projectState.documents, onAddDocument]
  );

  const handleDeleteDocument = useCallback(
    async (documentId: string) => {
      // Don't delete if it's the last document
      if (projectState.documents.length <= 1) return;

      // If external callback is provided, use it instead of local state management
      if (onDeleteDocument) {
        await onDeleteDocument(documentId);
        // Handle selection change after external deletion
        if (selectedDocumentId === documentId) {
          const deletedIndex = projectState.documents.findIndex((doc) => doc.id === documentId);
          const remainingDocs = projectState.documents.filter((doc) => doc.id !== documentId);
          const newSelectedIndex = Math.min(deletedIndex, remainingDocs.length - 1);
          const newSelectedDoc = remainingDocs[newSelectedIndex];
          if (newSelectedDoc) {
            setSelectedDocumentId(newSelectedDoc.id);
          }
        }
        return;
      }

      // Find the index of the document to delete
      const deletedIndex = projectState.documents.findIndex((doc) => doc.id === documentId);
      if (deletedIndex === -1) return;

      // Remove from project state
      setProjectState((prev) => ({
        ...prev,
        documents: prev.documents.filter((doc) => doc.id !== documentId),
      }));

      // Remove editor state
      setDocumentStates((prev) => {
        const newStates = { ...prev };
        delete newStates[documentId];
        return newStates;
      });

      // Remove section selection
      setSelectedSectionIdByDocument((prev) => {
        const newSelections = { ...prev };
        delete newSelections[documentId];
        return newSelections;
      });

      // If the deleted document was selected, select another document
      if (selectedDocumentId === documentId) {
        const remainingDocs = projectState.documents.filter((doc) => doc.id !== documentId);
        const newSelectedIndex = Math.min(deletedIndex, remainingDocs.length - 1);
        const newSelectedDoc = remainingDocs[newSelectedIndex];
        if (newSelectedDoc) {
          setSelectedDocumentId(newSelectedDoc.id);
        }
      }
    },
    [projectState.documents, selectedDocumentId, onDeleteDocument]
  );

  const handleReorderDocument = useCallback((documentId: string, direction: 'up' | 'down') => {
    setProjectState((prev) => {
      // Group documents by kind to reorder within the same kind group
      const kindGroups = new Map<string, Document[]>();
      for (const doc of prev.documents) {
        const existing = kindGroups.get(doc.kind) ?? [];
        existing.push(doc);
        kindGroups.set(doc.kind, existing);
      }

      // Find the document and its group
      const targetDoc = prev.documents.find((doc) => doc.id === documentId);
      if (!targetDoc) return prev;

      const group = kindGroups.get(targetDoc.kind);
      if (!group) return prev;

      const indexInGroup = group.findIndex((doc) => doc.id === documentId);
      if (indexInGroup === -1) return prev;

      // Check boundaries
      if (direction === 'up' && indexInGroup === 0) return prev;
      if (direction === 'down' && indexInGroup === group.length - 1) return prev;

      // Swap within the group
      const newIndex = direction === 'up' ? indexInGroup - 1 : indexInGroup + 1;
      const newGroup = [...group];
      [newGroup[indexInGroup], newGroup[newIndex]] = [newGroup[newIndex]!, newGroup[indexInGroup]!];
      kindGroups.set(targetDoc.kind, newGroup);

      // Rebuild the documents array maintaining kind order
      const kindOrder = ['screen-spec', 'api-spec', 'er-spec', 'business-rule'];
      const newDocuments: Document[] = [];

      for (const kind of kindOrder) {
        const docs = kindGroups.get(kind);
        if (docs) {
          newDocuments.push(...docs);
          kindGroups.delete(kind);
        }
      }

      // Add any remaining kinds
      for (const docs of kindGroups.values()) {
        newDocuments.push(...docs);
      }

      return { ...prev, documents: newDocuments };
    });
  }, []);

  const handleDocumentTitleChange = useCallback(
    async (documentId: string, newTitle: string) => {
      // If external callback is provided, use it
      if (onDocumentTitleChange) {
        await onDocumentTitleChange(documentId, newTitle);
        return;
      }

      const uniqueTitle = ensureUniqueDocumentTitle(documentId, newTitle, projectState.documents);
      if (!uniqueTitle) return;

      setProjectState((prev) => ({
        ...prev,
        documents: prev.documents.map((doc) =>
          doc.id === documentId ? { ...doc, title: uniqueTitle } : doc
        ),
      }));

      // Update the document reference in editor state.
      // Since API connections now use ID-based references (apiRef),
      // label changes are resolved dynamically - no sync needed.
      setDocumentStates((prev) => {
        const renamedState = prev[documentId];
        if (!renamedState) return prev;
        return {
          ...prev,
          [documentId]: {
            ...renamedState,
            document: { ...renamedState.document, title: uniqueTitle },
          },
        };
      });
    },
    [projectState.documents, onDocumentTitleChange]
  );

  const handleNavigateToField = useCallback(
    (documentId: string, sectionId: string, fieldId: string, _rowIndex?: number) => {
      const isCrossDocument = documentId !== currentDocument?.id;
      if (isCrossDocument) {
        setSelectedDocumentId(documentId);
      }
      if (sectionId !== selectedSectionId || isCrossDocument) {
        setSelectedSectionIdByDocument((prev) => ({
          ...prev,
          [documentId]: sectionId,
        }));
      }
      // Use longer delay for cross-document navigation to allow re-render
      setTimeout(
        () => {
          setFocusFieldId(fieldId);
        },
        isCrossDocument ? 150 : 50
      );
    },
    [selectedSectionId, currentDocument?.id]
  );

  const handleFocusHandled = useCallback(() => {
    setFocusFieldId(null);
  }, []);

  const handleNavigateToReference = useCallback(
    (documentId: string, sectionId?: string, fieldId?: string) => {
      // Navigate directly to the referenced document
      const targetDoc = projectState.documents.find((doc) => doc.id === documentId);
      if (!targetDoc) return;

      const targetSectionId = sectionId || targetDoc.sections[0]?.id || '';
      handleNavigateToField(documentId, targetSectionId, fieldId ?? '');
    },
    [projectState.documents, handleNavigateToField]
  );

  const handleHealthNavigateToDocument = useCallback(
    (documentId: string, sectionId: string, fieldId: string) => {
      setViewMode('editor');
      handleNavigateToField(documentId, sectionId, fieldId);
    },
    [handleNavigateToField]
  );

  const handleImportProject = useCallback(
    (importedProject: Project, importedDocumentStates: DocumentEditorState[]) => {
      setProjectState(importedProject);

      // Convert array of states to record keyed by document id
      const statesRecord: Record<string, DocumentEditorState> = {};
      for (const state of importedDocumentStates) {
        statesRecord[state.document.id] = state;
      }
      setDocumentStates(statesRecord);

      // Initialize section selections for all documents
      const sectionSelections: Record<string, string> = {};
      for (const doc of importedProject.documents) {
        sectionSelections[doc.id] = doc.sections[0]?.id ?? '';
      }
      setSelectedSectionIdByDocument(sectionSelections);

      // Select the first document
      if (importedProject.documents[0]) {
        setSelectedDocumentId(importedProject.documents[0].id);
      }
    },
    []
  );

  const handleImportDocument = useCallback(
    (importedDocument: Document, importedFieldValues: Record<string, FieldValue>) => {
      // Add document to project
      setProjectState((prev) => ({
        ...prev,
        documents: [...prev.documents, importedDocument],
      }));

      // Add editor state
      setDocumentStates((prev) => ({
        ...prev,
        [importedDocument.id]: {
          document: importedDocument,
          fieldValues: importedFieldValues,
        },
      }));

      // Initialize section selection
      setSelectedSectionIdByDocument((prev) => ({
        ...prev,
        [importedDocument.id]: importedDocument.sections[0]?.id ?? '',
      }));

      // Select the imported document
      setSelectedDocumentId(importedDocument.id);
    },
    []
  );

  // Show add document UI when there are no documents
  if (!currentDocument) {
    return (
      <main
        style={{
          fontFamily:
            "'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif",
          backgroundColor: '#F1F5F9',
          minHeight: '100vh',
          padding: '24px',
          boxSizing: 'border-box',
        }}
      >
        <header
          style={{
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' }}>
              SpecForge
            </h1>
            <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '0.875rem' }}>
              {projectState.title}
            </p>
          </div>
        </header>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            padding: '48px',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: '0 0 24px', color: '#64748B', fontSize: '0.875rem' }}>
            ドキュメントがありません。最初のドキュメントを追加してください。
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {(['screen-spec', 'api-spec', 'er-spec', 'business-rule'] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => handleAddDocument(kind)}
                style={{
                  padding: '10px 20px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  backgroundColor: '#3B82F6',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                {kind === 'screen-spec' && '画面仕様書を追加'}
                {kind === 'api-spec' && 'API仕様書を追加'}
                {kind === 'er-spec' && 'ER設計書を追加'}
                {kind === 'business-rule' && 'ビジネスルールを追加'}
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        fontFamily:
          "'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif",
        backgroundColor: '#F1F5F9',
        minHeight: '100vh',
        padding: '24px',
        boxSizing: 'border-box' as const,
        maxWidth: '100vw',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' }}>
            SpecForge
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '0.875rem' }}>
            スキーマ駆動の構造化設計書エディタ
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isSaving && (
            <span
              style={{
                fontSize: '0.75rem',
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginRight: '8px',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#3B82F6',
                  borderRadius: '50%',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
              保存中...
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#475569',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            インポート
          </button>
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#475569',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            エクスポート
          </button>
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'editor' ? 'health' : 'editor')}
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: viewMode === 'health' ? '#FFFFFF' : '#475569',
              backgroundColor: viewMode === 'health' ? '#3B82F6' : '#FFFFFF',
              border: `1px solid ${viewMode === 'health' ? '#3B82F6' : '#CBD5E1'}`,
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {viewMode === 'health' ? 'エディタに戻る' : 'プロジェクトヘルス'}
          </button>
          <div
            style={{ width: '1px', height: '24px', backgroundColor: '#E2E8F0', margin: '0 4px' }}
          />
          <UserMenu />
        </div>
      </header>

      {viewMode === 'health' ? (
        <ProjectHealthDashboard
          project={projectState}
          documentStates={documentStates}
          projectValidation={projectQuality}
          allValidationItems={allValidationItems}
          onNavigateToDocument={handleHealthNavigateToDocument}
          onBack={() => setViewMode('editor')}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '240px 1fr 320px',
            gap: '16px',
            alignItems: 'start',
            minWidth: 0,
          }}
        >
          <aside
            style={{
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: '#FFFFFF',
              minWidth: 0,
            }}
          >
            {/* Project title */}
            {editingProjectTitle ? (
              <input
                type="text"
                autoFocus
                maxLength={100}
                defaultValue={projectState.title}
                onBlur={async (e) => {
                  const newTitle = e.target.value.trim();
                  if (newTitle) {
                    if (onProjectTitleChange) {
                      await onProjectTitleChange(newTitle);
                    } else {
                      setProjectState((prev) => ({ ...prev, title: newTitle }));
                    }
                  }
                  setEditingProjectTitle(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    (e.target as HTMLInputElement).blur();
                  } else if (e.key === 'Escape') {
                    setEditingProjectTitle(false);
                  }
                }}
                style={{
                  margin: '0 0 12px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#0F172A',
                  border: '1px solid #3B82F6',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  width: '100%',
                  boxSizing: 'border-box',
                  outline: 'none',
                  letterSpacing: '0.05em',
                }}
              />
            ) : (
              <h2
                style={{
                  margin: '0 0 12px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="クリックしてプロジェクト名を編集"
                onClick={() => setEditingProjectTitle(true)}
              >
                Project · {projectState.title}
                <span style={{ fontSize: '0.65rem', color: '#94A3B8', textTransform: 'none' }}>
                  (編集)
                </span>
              </h2>
            )}

            {/* Document list */}
            <DocumentList
              documents={projectState.documents}
              selectedDocumentId={selectedDocumentId}
              onSelectDocument={handleDocumentSelect}
              onAddDocument={handleAddDocument}
              onDeleteDocument={
                projectState.documents.length > 1 ? handleDeleteDocument : undefined
              }
              onReorderDocument={handleReorderDocument}
            />

            {/* Divider */}
            <div
              style={{
                height: '1px',
                backgroundColor: '#E2E8F0',
                margin: '12px 0',
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
                  if (e.key === 'Enter') {
                    (e.target as HTMLInputElement).blur();
                  } else if (e.key === 'Escape') {
                    setEditingTitleDocId(null);
                  }
                }}
                style={{
                  margin: '0 0 4px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#0F172A',
                  border: '1px solid #3B82F6',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  width: '100%',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            ) : (
              <h3
                style={{
                  margin: '0 0 4px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#0F172A',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="クリックしてタイトルを編集"
                onClick={() => setEditingTitleDocId(currentDocument.id)}
              >
                {currentDocument.title}
                <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>(編集)</span>
              </h3>
            )}
            <p style={{ margin: '0 0 12px', color: '#94A3B8', fontSize: '0.75rem' }}>
              種別: {currentDocument.kind} / バージョン: {currentDocument.version}
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
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: '#FFFFFF',
              minWidth: 0,
            }}
          >
            {/* Edit / Preview toggle */}
            <div
              style={{
                display: 'flex',
                gap: '0',
                borderBottom: '1px solid #E2E8F0',
                marginBottom: '16px',
              }}
            >
              {(['edit', 'preview'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setCenterMode(mode)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.8rem',
                    fontWeight: centerMode === mode ? 600 : 400,
                    color: centerMode === mode ? '#3B82F6' : '#64748B',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom:
                      centerMode === mode ? '2px solid #3B82F6' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'color 0.15s, border-color 0.15s',
                  }}
                >
                  {mode === 'edit' ? '編集' : 'プレビュー'}
                </button>
              ))}
            </div>

            {centerMode === 'edit' ? (
              selectedSection ? (
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
                <p style={{ color: '#64748B' }}>セクションが存在しません。</p>
              )
            ) : (
              <DocumentPreview document={currentDocument} state={currentDocumentState} />
            )}
          </section>

          <RightPanel
            key={`right:${currentDocument.id}`}
            document={currentDocument}
            state={currentDocumentState}
            validationItems={validationItems}
            allValidationItems={allValidationItems}
            projectValidation={projectQuality}
            project={projectState}
            documentStates={documentStates}
            onNavigateToField={handleNavigateToField}
          />
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        project={projectState}
        documentStates={documentStates}
        currentDocumentId={selectedDocumentId}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportProject={handleImportProject}
        onImportDocument={handleImportDocument}
      />

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </main>
  );
}
