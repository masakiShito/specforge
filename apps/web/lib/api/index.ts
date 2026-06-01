/**
 * API Module
 * Re-exports all API client functions and types
 */

// Client utilities
export {
  ApiError,
  getAuthHeaders,
  handleResponse,
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
} from './client';

// Project and Document API
export {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  createDocument,
  updateDocument,
  deleteDocument,
  reorderDocument,
} from './projects';

// Types
export type {
  ApiDocument,
  ApiProject,
  ApiProjectListItem,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  DocumentCreateRequest,
  DocumentUpdateRequest,
  DocumentReorderRequest,
} from './projects';

// Converters
export {
  apiDocumentToDocument,
  apiDocumentToEditorState,
  apiProjectToProject,
  apiProjectToFullState,
} from './converters';
