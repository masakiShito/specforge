"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Document, DocumentKind, Project } from "@specforge/document-schema";

import type { DocumentEditorState, FieldValue } from "../lib/document-editor/create-document-state";
import { createDocumentState } from "../lib/document-editor/create-document-state";
import { updateFieldValue } from "../lib/document-editor/update-field-value";
import { createDocument } from "../lib/document-editor/create-document";
import {
  getProject,
  updateProject as apiUpdateProject,
  createDocument as apiCreateDocument,
  updateDocument as apiUpdateDocument,
  deleteDocument as apiDeleteDocument,
  apiProjectToFullState,
  ApiError,
} from "../lib/api";

// =============================================================================
// Types
// =============================================================================

interface UseProjectSyncOptions {
  projectId: string;
}

interface UseProjectSyncReturn {
  project: Project | null;
  documentStates: Record<string, DocumentEditorState>;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  setProject: React.Dispatch<React.SetStateAction<Project | null>>;
  setDocumentStates: React.Dispatch<React.SetStateAction<Record<string, DocumentEditorState>>>;
  clearError: () => void;
  handleFieldValueChangeWithSync: (documentId: string, fieldId: string, value: FieldValue) => void;
  handleAddDocumentWithSync: (kind: DocumentKind) => Promise<void>;
  handleDeleteDocumentWithSync: (documentId: string) => Promise<void>;
  handleDocumentTitleChangeWithSync: (documentId: string, title: string) => Promise<void>;
  handleProjectTitleChangeWithSync: (title: string) => Promise<void>;
}

// Debounce delay for field value changes (ms)
const DEBOUNCE_DELAY = 2000;

// =============================================================================
// Hook Implementation
// =============================================================================

export function useProjectSync({ projectId }: UseProjectSyncOptions): UseProjectSyncReturn {
  const [project, setProject] = useState<Project | null>(null);
  const [documentStates, setDocumentStates] = useState<Record<string, DocumentEditorState>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for debouncing
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const pendingUpdates = useRef<Record<string, Record<string, FieldValue>>>({});
  const projectRef = useRef<Project | null>(project);
  const documentStatesRef = useRef<Record<string, DocumentEditorState>>(documentStates);

  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  useEffect(() => {
    documentStatesRef.current = documentStates;
  }, [documentStates]);

  // Clear error
  const clearError = useCallback(() => setError(null), []);

  // Load project on mount
  useEffect(() => {
    let isCancelled = false;

    async function loadProject() {
      try {
        setIsLoading(true);
        setError(null);
        const apiProject = await getProject(projectId);
        if (isCancelled) return;

        const { project: loadedProject, documentStates: loadedStates } = apiProjectToFullState(apiProject);
        setProject(loadedProject);
        setDocumentStates(loadedStates);
      } catch (err) {
        if (isCancelled) return;
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("プロジェクトの読み込みに失敗しました");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadProject();

    return () => {
      isCancelled = true;
    };
  }, [projectId]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      for (const timer of Object.values(debounceTimers.current)) {
        clearTimeout(timer);
      }
    };
  }, []);

  // Flush pending updates for a document
  const flushPendingUpdate = useCallback(async (documentId: string) => {
    const updates = pendingUpdates.current[documentId];
    if (!updates || Object.keys(updates).length === 0) return;

    // Get current document state content
    const currentState = documentStatesRef.current[documentId];
    if (!currentState) return;

    const content = { ...currentState.fieldValues };

    // Clear pending updates
    delete pendingUpdates.current[documentId];

    try {
      setIsSaving(true);
      await apiUpdateDocument(documentId, { content });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("保存に失敗しました");
      }
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Handle field value change with debounced sync
  const handleFieldValueChangeWithSync = useCallback(
    (documentId: string, fieldId: string, value: FieldValue) => {
      // Update local state immediately
      setDocumentStates((prev) => {
        const docState = prev[documentId];
        if (!docState) return prev;
        return {
          ...prev,
          [documentId]: updateFieldValue(docState, fieldId, value),
        };
      });

      // Track pending update
      if (!pendingUpdates.current[documentId]) {
        pendingUpdates.current[documentId] = {};
      }
      pendingUpdates.current[documentId][fieldId] = value;

      // Clear existing timer for this document
      if (debounceTimers.current[documentId]) {
        clearTimeout(debounceTimers.current[documentId]);
      }

      // Set new debounce timer
      debounceTimers.current[documentId] = setTimeout(() => {
        flushPendingUpdate(documentId);
        delete debounceTimers.current[documentId];
      }, DEBOUNCE_DELAY);
    },
    [flushPendingUpdate]
  );

  // Handle add document with sync
  const handleAddDocumentWithSync = useCallback(
    async (kind: DocumentKind) => {
      const currentProject = projectRef.current;
      if (!currentProject) return;

      const existingDocs = currentProject.documents;
      const newDoc = createDocument(kind, existingDocs);

      try {
        setIsSaving(true);
        const apiDoc = await apiCreateDocument(currentProject.id, {
          title: newDoc.title,
          key: newDoc.key,
          kind: newDoc.kind,
          version: newDoc.version,
          content: {},
        });

        // Update document with API-assigned ID
        const syncedDoc: Document = {
          ...newDoc,
          id: apiDoc.id,
          key: apiDoc.key,
        };

        // Update project state
        setProject((prev) =>
          prev
            ? {
                ...prev,
                documents: [...prev.documents, syncedDoc],
              }
            : null
        );

        // Create editor state for new document
        setDocumentStates((prev) => ({
          ...prev,
          [syncedDoc.id]: createDocumentState(syncedDoc),
        }));
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("ドキュメントの作成に失敗しました");
        }
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  // Handle delete document with sync
  const handleDeleteDocumentWithSync = useCallback(
    async (documentId: string) => {
      const currentProject = projectRef.current;
      if (!currentProject) return;

      // Don't delete if it's the last document
      if (currentProject.documents.length <= 1) return;

      try {
        setIsSaving(true);
        await apiDeleteDocument(documentId);

        // Update project state
        setProject((prev) =>
          prev
            ? {
                ...prev,
                documents: prev.documents.filter((doc) => doc.id !== documentId),
              }
            : null
        );

        // Remove editor state
        setDocumentStates((prev) => {
          const newStates = { ...prev };
          delete newStates[documentId];
          return newStates;
        });

        // Clear any pending updates
        delete pendingUpdates.current[documentId];
        if (debounceTimers.current[documentId]) {
          clearTimeout(debounceTimers.current[documentId]);
          delete debounceTimers.current[documentId];
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("ドキュメントの削除に失敗しました");
        }
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  // Handle document title change with sync
  const handleDocumentTitleChangeWithSync = useCallback(
    async (documentId: string, title: string) => {
      const currentProject = projectRef.current;
      if (!currentProject) return;

      const trimmedTitle = title.trim();
      if (!trimmedTitle) return;

      // Ensure unique title
      const existingTitles = new Set(
        currentProject.documents.filter((doc) => doc.id !== documentId).map((doc) => doc.title)
      );

      let uniqueTitle = trimmedTitle;
      if (existingTitles.has(trimmedTitle)) {
        let suffix = 2;
        while (existingTitles.has(`${trimmedTitle} ${suffix}`)) {
          suffix += 1;
        }
        uniqueTitle = `${trimmedTitle} ${suffix}`;
      }

      // Update local state immediately
      setProject((prev) =>
        prev
          ? {
              ...prev,
              documents: prev.documents.map((doc) =>
                doc.id === documentId ? { ...doc, title: uniqueTitle } : doc
              ),
            }
          : null
      );

      setDocumentStates((prev) => {
        const docState = prev[documentId];
        if (!docState) return prev;
        return {
          ...prev,
          [documentId]: {
            ...docState,
            document: { ...docState.document, title: uniqueTitle },
          },
        };
      });

      // Sync to API
      try {
        setIsSaving(true);
        await apiUpdateDocument(documentId, { title: uniqueTitle });
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("タイトルの更新に失敗しました");
        }
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  // Handle project title change with sync
  const handleProjectTitleChangeWithSync = useCallback(
    async (title: string) => {
      const currentProject = projectRef.current;
      if (!currentProject) return;

      const trimmedTitle = title.trim();
      if (!trimmedTitle) return;

      // Update local state immediately
      setProject((prev) => (prev ? { ...prev, title: trimmedTitle } : null));

      // Sync to API
      try {
        setIsSaving(true);
        await apiUpdateProject(currentProject.id, { title: trimmedTitle });
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("プロジェクト名の更新に失敗しました");
        }
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  return {
    project,
    documentStates,
    isLoading,
    isSaving,
    error,
    setProject,
    setDocumentStates,
    clearError,
    handleFieldValueChangeWithSync,
    handleAddDocumentWithSync,
    handleDeleteDocumentWithSync,
    handleDocumentTitleChangeWithSync,
    handleProjectTitleChangeWithSync,
  };
}
