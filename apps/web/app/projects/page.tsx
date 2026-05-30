"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ProtectedRoute } from "../../components/auth";
import { ErrorBanner } from "../../components/common/ErrorBanner";
import {
  listProjects,
  createProject,
  deleteProject,
  ApiError,
  type ApiProjectListItem,
} from "../../lib/api";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ProjectsListContent() {
  const router = useRouter();
  const [projects, setProjects] = useState<ApiProjectListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectKey, setNewProjectKey] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load projects
  useEffect(() => {
    async function loadProjects() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await listProjects();
        setProjects(data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("プロジェクトの読み込みに失敗しました");
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadProjects();
  }, []);

  // Auto-generate key from title
  useEffect(() => {
    if (newProjectTitle) {
      setNewProjectKey(slugify(newProjectTitle) || "project");
    }
  }, [newProjectTitle]);

  const handleCreateProject = useCallback(async () => {
    if (!newProjectTitle.trim()) return;

    try {
      setIsCreating(true);
      setError(null);
      const project = await createProject({
        title: newProjectTitle.trim(),
        key: newProjectKey || slugify(newProjectTitle) || "project",
      });
      setShowCreateModal(false);
      setNewProjectTitle("");
      setNewProjectKey("");
      router.push(`/projects/${project.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("プロジェクトの作成に失敗しました");
      }
    } finally {
      setIsCreating(false);
    }
  }, [newProjectTitle, newProjectKey, router]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    try {
      setIsDeleting(true);
      setError(null);
      await deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      setShowDeleteConfirm(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("プロジェクトの削除に失敗しました");
      }
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return (
    <main
      style={{
        fontFamily: "'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif",
        backgroundColor: "#F1F5F9",
        minHeight: "100vh",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      <header style={{ marginBottom: "24px" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#0F172A" }}>
          SpecForge
        </h1>
        <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: "0.875rem" }}>
          プロジェクト一覧
        </p>
      </header>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <div style={{ marginBottom: "16px" }}>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: "10px 20px",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "#FFFFFF",
            backgroundColor: "#3B82F6",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "background-color 0.15s",
          }}
        >
          新規プロジェクト
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "48px" }}>
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
      ) : projects.length === 0 ? (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "8px",
            border: "1px solid #E2E8F0",
            padding: "48px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#64748B", fontSize: "0.875rem", margin: 0 }}>
            プロジェクトがありません。新規プロジェクトを作成してください。
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "16px",
          }}
        >
          {projects.map((project) => (
            <div
              key={project.id}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "8px",
                border: "1px solid #E2E8F0",
                padding: "20px",
                cursor: "pointer",
                transition: "box-shadow 0.15s, border-color 0.15s",
              }}
              onClick={() => router.push(`/projects/${project.id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
                e.currentTarget.style.borderColor = "#3B82F6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "#E2E8F0";
              }}
            >
              <h3 style={{ margin: "0 0 8px", fontSize: "1rem", fontWeight: 600, color: "#0F172A" }}>
                {project.title}
              </h3>
              <p style={{ margin: "0 0 4px", fontSize: "0.75rem", color: "#94A3B8" }}>
                key: {project.key}
              </p>
              <p style={{ margin: "0 0 12px", fontSize: "0.75rem", color: "#64748B" }}>
                {project.document_count} ドキュメント
              </p>
              {project.description && (
                <p style={{ margin: "0 0 12px", fontSize: "0.8rem", color: "#475569" }}>
                  {project.description}
                </p>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(project.id);
                  }}
                  style={{
                    padding: "4px 8px",
                    fontSize: "0.75rem",
                    color: "#DC2626",
                    backgroundColor: "transparent",
                    border: "1px solid #FECACA",
                    borderRadius: "4px",
                    cursor: "pointer",
                    transition: "background-color 0.15s",
                  }}
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              padding: "24px",
              width: "100%",
              maxWidth: "400px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: "0 0 20px", fontSize: "1.125rem", fontWeight: 600 }}>
              新規プロジェクト
            </h2>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  color: "#374151",
                }}
              >
                プロジェクト名 *
              </label>
              <input
                type="text"
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
                placeholder="例: ユーザー管理システム"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "0.875rem",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  color: "#374151",
                }}
              >
                プロジェクトキー *
              </label>
              <input
                type="text"
                value={newProjectKey}
                onChange={(e) => setNewProjectKey(e.target.value)}
                placeholder="例: user-management"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "0.875rem",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
              <p style={{ margin: "4px 0 0", fontSize: "0.7rem", color: "#6B7280" }}>
                URLやAPIで使用される識別子です（半角英数字とハイフン）
              </p>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{
                  padding: "8px 16px",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  color: "#374151",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleCreateProject}
                disabled={!newProjectTitle.trim() || isCreating}
                style={{
                  padding: "8px 16px",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  color: "#FFFFFF",
                  backgroundColor: !newProjectTitle.trim() || isCreating ? "#9CA3AF" : "#3B82F6",
                  border: "none",
                  borderRadius: "6px",
                  cursor: !newProjectTitle.trim() || isCreating ? "not-allowed" : "pointer",
                }}
              >
                {isCreating ? "作成中..." : "作成"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              padding: "24px",
              width: "100%",
              maxWidth: "400px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: "0 0 12px", fontSize: "1.125rem", fontWeight: 600 }}>
              プロジェクトを削除しますか？
            </h2>
            <p style={{ margin: "0 0 20px", fontSize: "0.875rem", color: "#6B7280" }}>
              この操作は取り消せません。プロジェクト内のすべてのドキュメントも削除されます。
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(null)}
                style={{
                  padding: "8px 16px",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  color: "#374151",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => handleDeleteProject(showDeleteConfirm)}
                disabled={isDeleting}
                style={{
                  padding: "8px 16px",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  color: "#FFFFFF",
                  backgroundColor: isDeleting ? "#F87171" : "#DC2626",
                  border: "none",
                  borderRadius: "6px",
                  cursor: isDeleting ? "not-allowed" : "pointer",
                }}
              >
                {isDeleting ? "削除中..." : "削除"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}

export default function ProjectsPage() {
  return (
    <ProtectedRoute>
      <ProjectsListContent />
    </ProtectedRoute>
  );
}
