/**
 * API Data Converters
 * Convert between API response types and frontend Document/Project types
 */

import type { Document, Project, DocumentKind } from '@specforge/document-schema';
import {
  screenSpecPreset,
  apiSpecPreset,
  erSpecPreset,
  businessRulePreset,
} from '@specforge/document-schema';

import type { DocumentEditorState, FieldValue } from '../document-editor/create-document-state';
import type { ApiDocument, ApiProject } from './projects';

// =============================================================================
// Preset Map
// =============================================================================

const PRESET_MAP: Record<string, Document> = {
  'screen-spec': screenSpecPreset,
  'api-spec': apiSpecPreset,
  'er-spec': erSpecPreset,
  'business-rule': businessRulePreset,
};

// =============================================================================
// ID Generation Helpers
// =============================================================================

let idCounter = 0;

function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

// =============================================================================
// Document Converters
// =============================================================================

/**
 * Clone a preset with fresh IDs, preserving the structure
 */
function clonePresetWithFreshIds(preset: Document, docId: string): Document {
  return {
    ...preset,
    id: docId,
    key: `${preset.key}-${docId}`,
    sections: preset.sections.map((section) => {
      const sectionId = nextId('sec');
      return {
        ...section,
        id: sectionId,
        fields: section.fields.map((field) => {
          const fieldId = nextId('fld');
          return {
            ...field,
            id: fieldId,
            table: field.table
              ? {
                  ...field.table,
                  id: nextId('tbl'),
                  columns: field.table.columns.map((col) => ({
                    ...col,
                    id: nextId('col'),
                    options: col.options?.map((opt) => ({
                      ...opt,
                      id: nextId('opt'),
                    })),
                  })),
                  defaultRows: [],
                }
              : undefined,
            options: field.options?.map((opt) => ({
              ...opt,
              id: nextId('opt'),
            })),
          };
        }),
        references: section.references?.map((ref) => ({
          ...ref,
          id: nextId('ref'),
        })),
      };
    }),
  };
}

/**
 * Convert API document response to frontend Document type
 * Reconstructs sections from preset based on document kind
 */
export function apiDocumentToDocument(apiDoc: ApiDocument): Document {
  const preset = PRESET_MAP[apiDoc.kind];
  if (!preset) {
    throw new Error(`Unknown document kind: ${apiDoc.kind}`);
  }

  // Clone the preset with fresh IDs, then override with API data
  const clonedDoc = clonePresetWithFreshIds(preset, apiDoc.id);

  return {
    ...clonedDoc,
    id: apiDoc.id,
    key: apiDoc.key,
    title: apiDoc.title,
    kind: apiDoc.kind as DocumentKind,
    version: apiDoc.version,
    required: true,
  };
}

/**
 * Convert API document to DocumentEditorState
 * fieldValues come from apiDoc.content
 */
export function apiDocumentToEditorState(apiDoc: ApiDocument): DocumentEditorState {
  const document = apiDocumentToDocument(apiDoc);
  const fieldValues = (apiDoc.content || {}) as Record<string, FieldValue>;

  return {
    document,
    fieldValues,
  };
}

// =============================================================================
// Project Converters
// =============================================================================

/**
 * Convert API project response to frontend Project type
 */
export function apiProjectToProject(apiProject: ApiProject): Project {
  const documents = apiProject.documents
    .sort((a, b) => a.order - b.order)
    .map(apiDocumentToDocument);

  return {
    id: apiProject.id,
    key: apiProject.key,
    title: apiProject.title,
    required: true,
    documents,
  };
}

/**
 * Convert API project to full state including documentStates
 */
export function apiProjectToFullState(apiProject: ApiProject): {
  project: Project;
  documentStates: Record<string, DocumentEditorState>;
} {
  const project = apiProjectToProject(apiProject);
  const documentStates: Record<string, DocumentEditorState> = {};

  for (const apiDoc of apiProject.documents) {
    documentStates[apiDoc.id] = apiDocumentToEditorState(apiDoc);
  }

  return { project, documentStates };
}
