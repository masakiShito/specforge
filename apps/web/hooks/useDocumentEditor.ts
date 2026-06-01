'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  normalizeProjectData,
  sampleScreenSpecProject,
  type Document,
  type DocumentKind,
  type Project,
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
import type { ValidationItem } from '../types/validation';

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

/**
 * Ensure document title is unique within project.
 */
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

export interface UseDocumentEditorOptions {
  initialProject?: Project | Document;
}

export interface UseDocumentEditorReturn {
  // State
  projectState: Project;
  documentStates: Record<string, DocumentEditorState>;
  selectedDocumentId: string;
  currentDocument: Document | undefined;
  currentDocumentState: DocumentEditorState;
  selectedSectionId: string;
  focusFieldId: string | null;
  editingTitleDocId: string | null;
  editingProjectTitle: boolean;
  centerMode: 'edit' | 'preview';
  viewMode: 'editor' | 'health';
  fieldRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;

  // Validation
  validation: ReturnType<typeof validateDocument>;
  designQuality: ReturnType<typeof validateDesignQuality>;
  projectQuality: ReturnType<typeof validateProjectQuality>;
  validationItems: ValidationItem[];
  allValidationItems: ValidationItem[];
  errorFieldIds: Set<string>;
  cellErrors: Set<string>;
  cellWarnings: Set<string>;

  // Setters
  setSelectedDocumentId: (id: string) => void;
  setSelectedSectionId: (id: string) => void;
  setFocusFieldId: (id: string | null) => void;
  setEditingTitleDocId: (id: string | null) => void;
  setEditingProjectTitle: (editing: boolean) => void;
  setCenterMode: (mode: 'edit' | 'preview') => void;
  setViewMode: (mode: 'editor' | 'health') => void;

  // Handlers
  handleFieldValueChange: (fieldId: string, value: FieldValue) => void;
  handleDocumentSelect: (documentId: string) => void;
  handleAddDocument: (kind: DocumentKind) => void;
  handleDocumentTitleChange: (documentId: string, newTitle: string) => void;
  handleProjectTitleChange: (newTitle: string) => void;
  handleNavigateToField: (
    documentId: string,
    sectionId: string,
    fieldId: string,
    rowIndex?: number
  ) => void;
  handleFocusHandled: () => void;
  handleNavigateToReference: (documentId: string, sectionId?: string, fieldId?: string) => void;
  handleHealthNavigateToDocument: (documentId: string, sectionId: string, fieldId: string) => void;
}

/**
 * Custom hook for managing document editor state and logic.
 *
 * Extracts complex state management from DocumentEditor component
 * to improve testability and maintainability.
 */
export function useDocumentEditor(options: UseDocumentEditorOptions = {}): UseDocumentEditorReturn {
  const { initialProject } = options;

  // Core state
  const [projectState, setProjectState] = useState<Project>(() =>
    normalizeProjectData(initialProject ?? sampleScreenSpecProject)
  );

  const [documentStates, setDocumentStates] = useState<Record<string, DocumentEditorState>>(() =>
    createProjectStates(projectState)
  );

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
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  // Computed values
  const documentById = useMemo(
    () => Object.fromEntries(projectState.documents.map((document) => [document.id, document])),
    [projectState.documents]
  );

  const fallbackDocumentId = projectState.documents[0]?.id ?? '';
  const currentDocument =
    (selectedDocumentId ? documentById[selectedDocumentId] : undefined) ??
    (fallbackDocumentId ? documentById[fallbackDocumentId] : undefined);

  const currentDocumentState =
    currentDocument && documentStates[currentDocument.id]
      ? documentStates[currentDocument.id]
      : createDocumentState(currentDocument!);

  const selectedSectionId = currentDocument
    ? (selectedSectionIdByDocument[currentDocument.id] ?? currentDocument.sections[0]?.id ?? '')
    : '';

  // Validation
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

  const allValidationItems = useMemo(() => {
    const items: ValidationItem[] = [];

    for (const doc of projectState.documents) {
      const state = documentStates[doc.id];
      if (!state) continue;

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

  // Handlers
  const handleFieldValueChange = useCallback(
    (fieldId: string, value: FieldValue) => {
      if (!currentDocument) return;
      setDocumentStates((prev) => ({
        ...prev,
        [currentDocument.id]: updateFieldValue(
          prev[currentDocument.id] ?? createDocumentState(currentDocument),
          fieldId,
          value
        ),
      }));
    },
    [currentDocument]
  );

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

      setProjectState((prev) => ({
        ...prev,
        documents: [...prev.documents, newDoc],
      }));

      setDocumentStates((prev) => ({
        ...prev,
        [newDoc.id]: createDocumentState(newDoc),
      }));

      setSelectedSectionIdByDocument((prev) => ({
        ...prev,
        [newDoc.id]: newDoc.sections[0]?.id ?? '',
      }));

      setSelectedDocumentId(newDoc.id);
    },
    [projectState.documents]
  );

  const handleDocumentTitleChange = useCallback(
    (documentId: string, newTitle: string) => {
      const uniqueTitle = ensureUniqueDocumentTitle(documentId, newTitle, projectState.documents);
      if (!uniqueTitle) return;

      setProjectState((prev) => ({
        ...prev,
        documents: prev.documents.map((doc) =>
          doc.id === documentId ? { ...doc, title: uniqueTitle } : doc
        ),
      }));

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
    [projectState.documents]
  );

  const handleProjectTitleChange = useCallback((newTitle: string) => {
    const trimmed = newTitle.trim();
    if (trimmed) {
      setProjectState((prev) => ({ ...prev, title: trimmed }));
    }
  }, []);

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

  const setSelectedSectionId = useCallback(
    (sectionId: string) => {
      if (!currentDocument) return;
      setSelectedSectionIdByDocument((prev) => ({
        ...prev,
        [currentDocument.id]: sectionId,
      }));
    },
    [currentDocument]
  );

  return {
    // State
    projectState,
    documentStates,
    selectedDocumentId,
    currentDocument,
    currentDocumentState,
    selectedSectionId,
    focusFieldId,
    editingTitleDocId,
    editingProjectTitle,
    centerMode,
    viewMode,
    fieldRefs,

    // Validation
    validation,
    designQuality,
    projectQuality,
    validationItems,
    allValidationItems,
    errorFieldIds,
    cellErrors,
    cellWarnings,

    // Setters
    setSelectedDocumentId,
    setSelectedSectionId,
    setFocusFieldId,
    setEditingTitleDocId,
    setEditingProjectTitle,
    setCenterMode,
    setViewMode,

    // Handlers
    handleFieldValueChange,
    handleDocumentSelect,
    handleAddDocument,
    handleDocumentTitleChange,
    handleProjectTitleChange,
    handleNavigateToField,
    handleFocusHandled,
    handleNavigateToReference,
    handleHealthNavigateToDocument,
  };
}
