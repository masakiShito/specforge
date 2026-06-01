/**
 * Projects API
 * Functions for managing projects and documents via the backend API
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './client';

// =============================================================================
// API Response Types (matching backend Pydantic models)
// =============================================================================

export interface ApiDocument {
  id: string;
  project_id: string;
  title: string;
  key: string;
  kind: string;
  version: string;
  order: number;
  content: Record<string, unknown>;
  description: string | null;
}

export interface ApiProject {
  id: string;
  title: string;
  key: string;
  description: string | null;
  documents: ApiDocument[];
}

export interface ApiProjectListItem {
  id: string;
  title: string;
  key: string;
  description: string | null;
  document_count: number;
}

// =============================================================================
// Request Types
// =============================================================================

export interface ProjectCreateRequest {
  title: string;
  key: string;
  description?: string | null;
}

export interface ProjectUpdateRequest {
  title?: string;
  description?: string | null;
}

export interface DocumentCreateRequest {
  title: string;
  key: string;
  kind: string;
  version?: string;
  content?: Record<string, unknown>;
  description?: string | null;
}

export interface DocumentUpdateRequest {
  title?: string;
  key?: string;
  version?: string;
  content?: Record<string, unknown>;
  description?: string | null;
}

export interface DocumentReorderRequest {
  new_order: number;
}

// =============================================================================
// Project API Functions
// =============================================================================

/**
 * List all projects
 */
export async function listProjects(): Promise<ApiProjectListItem[]> {
  return apiGet<ApiProjectListItem[]>('/api/v1/projects');
}

/**
 * Get a project by ID with all documents
 */
export async function getProject(id: string): Promise<ApiProject> {
  return apiGet<ApiProject>(`/api/v1/projects/${id}`);
}

/**
 * Create a new project
 */
export async function createProject(data: ProjectCreateRequest): Promise<ApiProject> {
  return apiPost<ApiProject>('/api/v1/projects', data);
}

/**
 * Update an existing project
 */
export async function updateProject(id: string, data: ProjectUpdateRequest): Promise<ApiProject> {
  return apiPut<ApiProject>(`/api/v1/projects/${id}`, data);
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<void> {
  return apiDelete(`/api/v1/projects/${id}`);
}

// =============================================================================
// Document API Functions
// =============================================================================

/**
 * Create a new document in a project
 */
export async function createDocument(
  projectId: string,
  data: DocumentCreateRequest
): Promise<ApiDocument> {
  return apiPost<ApiDocument>(`/api/v1/projects/${projectId}/documents`, data);
}

/**
 * Update an existing document
 */
export async function updateDocument(
  documentId: string,
  data: DocumentUpdateRequest
): Promise<ApiDocument> {
  return apiPut<ApiDocument>(`/api/v1/documents/${documentId}`, data);
}

/**
 * Delete a document
 */
export async function deleteDocument(documentId: string): Promise<void> {
  return apiDelete(`/api/v1/documents/${documentId}`);
}

/**
 * Reorder a document within its project
 */
export async function reorderDocument(
  projectId: string,
  documentId: string,
  newOrder: number
): Promise<ApiDocument> {
  const data: DocumentReorderRequest = { new_order: newOrder };
  return apiPatch<ApiDocument>(
    `/api/v1/projects/${projectId}/documents/${documentId}/reorder`,
    data
  );
}
