"use client";

import { use } from "react";
import { useRouter } from "next/navigation";

import { ProtectedRoute } from "../../../components/auth";
import { ErrorBanner } from "../../../components/common/ErrorBanner";
import { DocumentEditor } from "../../../components/document-editor";
import { useProjectSync } from "../../../hooks/useProjectSync";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

function ProjectEditorContent({ projectId }: { projectId: string }) {
  const router = useRouter();
  const {
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
  } = useProjectSync({ projectId });

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "#F1F5F9",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid #E2E8F0",
              borderTopColor: "#3B82F6",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "#64748B", fontSize: "0.875rem" }}>読み込み中...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#F1F5F9",
          padding: "24px",
          fontFamily: "'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif",
        }}
      >
        <ErrorBanner message={error} onDismiss={clearError} />
        <button
          type="button"
          onClick={() => router.push("/projects")}
          style={{
            padding: "10px 20px",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "#3B82F6",
            backgroundColor: "#FFFFFF",
            border: "1px solid #3B82F6",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          プロジェクト一覧に戻る
        </button>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div>
      {error && <ErrorBanner message={error} onDismiss={clearError} />}
      <DocumentEditor
        externalProject={project}
        externalDocumentStates={documentStates}
        setExternalProject={setProject}
        setExternalDocumentStates={setDocumentStates}
        onFieldValueChange={handleFieldValueChangeWithSync}
        onAddDocument={handleAddDocumentWithSync}
        onDeleteDocument={handleDeleteDocumentWithSync}
        onDocumentTitleChange={handleDocumentTitleChangeWithSync}
        onProjectTitleChange={handleProjectTitleChangeWithSync}
        isSaving={isSaving}
      />
    </div>
  );
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { id } = use(params);

  return (
    <ProtectedRoute>
      <ProjectEditorContent projectId={id} />
    </ProtectedRoute>
  );
}
