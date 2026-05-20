import type { Project, Document } from "@specforge/document-schema";
import { isProject, isDocument } from "@specforge/document-schema";
import type { DocumentEditorState, FieldValue } from "../document-editor/create-document-state";
import type { ProjectExportData, DocumentExportData, ImportResponse } from "./types";

const SUPPORTED_VERSIONS = ["1.0.0"];

/**
 * Import project from JSON string
 */
export function importProjectFromJson(
  jsonString: string
): ImportResponse<{ project: Project; documentStates: DocumentEditorState[] }> {
  try {
    const parsed = JSON.parse(jsonString);
    const validation = validateProjectImportData(parsed);

    if (!validation.valid) {
      return {
        success: false,
        error: "Invalid project data",
        details: validation.errors
      };
    }

    const exportData = parsed as ProjectExportData;

    // Regenerate IDs to avoid conflicts
    const { project, documentStates } = regenerateIds(
      exportData.project,
      exportData.documentStates
    );

    return {
      success: true,
      data: { project, documentStates }
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Import single document from JSON string
 */
export function importDocumentFromJson(
  jsonString: string
): ImportResponse<{ document: Document; fieldValues: Record<string, FieldValue> }> {
  try {
    const parsed = JSON.parse(jsonString);
    const validation = validateDocumentImportData(parsed);

    if (!validation.valid) {
      return {
        success: false,
        error: "Invalid document data",
        details: validation.errors
      };
    }

    const exportData = parsed as DocumentExportData;

    // Regenerate IDs to avoid conflicts
    const { document, fieldValues } = regenerateDocumentIds(
      exportData.document,
      exportData.fieldValues
    );

    return {
      success: true,
      data: { document, fieldValues }
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate import data structure
 */
export function validateImportData(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Data must be an object"] };
  }

  const obj = data as Record<string, unknown>;

  // Check version
  if (!obj.version || typeof obj.version !== "string") {
    errors.push("Missing or invalid version");
  } else if (!SUPPORTED_VERSIONS.includes(obj.version)) {
    errors.push(`Unsupported version: ${obj.version}. Supported: ${SUPPORTED_VERSIONS.join(", ")}`);
  }

  // Check if it's a project or document export
  if ("project" in obj) {
    return validateProjectImportData(data);
  } else if ("document" in obj) {
    return validateDocumentImportData(data);
  }

  errors.push("Data must contain either 'project' or 'document'");
  return { valid: false, errors };
}

function validateProjectImportData(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Data must be an object"] };
  }

  const obj = data as Record<string, unknown>;

  // Check version
  if (!obj.version || typeof obj.version !== "string") {
    errors.push("Missing or invalid version");
  } else if (!SUPPORTED_VERSIONS.includes(obj.version)) {
    errors.push(`Unsupported version: ${obj.version}`);
  }

  // Check project
  if (!obj.project) {
    errors.push("Missing project data");
  } else if (!isProject(obj.project)) {
    errors.push("Invalid project structure");
  }

  // Check documentStates
  if (!Array.isArray(obj.documentStates)) {
    errors.push("Missing or invalid documentStates array");
  } else {
    for (let i = 0; i < obj.documentStates.length; i++) {
      const state = obj.documentStates[i];
      if (!state || typeof state !== "object") {
        errors.push(`documentStates[${i}] is not an object`);
      } else if (!isDocument((state as Record<string, unknown>).document)) {
        errors.push(`documentStates[${i}].document is invalid`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateDocumentImportData(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Data must be an object"] };
  }

  const obj = data as Record<string, unknown>;

  // Check version
  if (!obj.version || typeof obj.version !== "string") {
    errors.push("Missing or invalid version");
  } else if (!SUPPORTED_VERSIONS.includes(obj.version)) {
    errors.push(`Unsupported version: ${obj.version}`);
  }

  // Check document
  if (!obj.document) {
    errors.push("Missing document data");
  } else if (!isDocument(obj.document)) {
    errors.push("Invalid document structure");
  }

  // Check fieldValues
  if (obj.fieldValues && typeof obj.fieldValues !== "object") {
    errors.push("Invalid fieldValues structure");
  }

  return { valid: errors.length === 0, errors };
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function regenerateIds(
  project: Project,
  documentStates: DocumentEditorState[]
): { project: Project; documentStates: DocumentEditorState[] } {
  const idMap = new Map<string, string>();

  // Create new project with new ID
  const newProjectId = generateId();
  idMap.set(project.id, newProjectId);

  // Create new documents with new IDs
  const newDocuments = project.documents.map((doc) => {
    const { document: newDoc, fieldIdMap } = regenerateDocumentIdsInternal(doc);
    idMap.set(doc.id, newDoc.id);

    // Merge field ID mappings
    for (const [oldId, newId] of fieldIdMap) {
      idMap.set(oldId, newId);
    }

    return newDoc;
  });

  // Update document states with new IDs
  const newDocumentStates = documentStates.map((state) => {
    const newDocId = idMap.get(state.document.id);
    const newDoc = newDocuments.find((d) => d.id === newDocId);

    if (!newDoc) {
      // Fallback: regenerate this document state independently
      const { document, fieldValues } = regenerateDocumentIds(state.document, state.fieldValues);
      return { document, fieldValues };
    }

    // Map field values to new IDs
    const newFieldValues: Record<string, FieldValue> = {};
    for (const [oldFieldId, value] of Object.entries(state.fieldValues)) {
      const newFieldId = idMap.get(oldFieldId) ?? oldFieldId;
      newFieldValues[newFieldId] = value;
    }

    return {
      document: newDoc,
      fieldValues: newFieldValues
    };
  });

  return {
    project: {
      ...project,
      id: newProjectId,
      documents: newDocuments
    },
    documentStates: newDocumentStates
  };
}

function regenerateDocumentIds(
  document: Document,
  fieldValues: Record<string, FieldValue>
): { document: Document; fieldValues: Record<string, FieldValue> } {
  const { document: newDoc, fieldIdMap } = regenerateDocumentIdsInternal(document);

  // Map field values to new IDs
  const newFieldValues: Record<string, FieldValue> = {};
  for (const [oldFieldId, value] of Object.entries(fieldValues)) {
    const newFieldId = fieldIdMap.get(oldFieldId) ?? oldFieldId;
    newFieldValues[newFieldId] = value;
  }

  return { document: newDoc, fieldValues: newFieldValues };
}

function regenerateDocumentIdsInternal(
  document: Document
): { document: Document; fieldIdMap: Map<string, string> } {
  const fieldIdMap = new Map<string, string>();
  const newDocId = generateId();

  const newSections = document.sections.map((section) => {
    const newSectionId = generateId();

    const newFields = section.fields.map((field) => {
      const newFieldId = generateId();
      fieldIdMap.set(field.id, newFieldId);

      // Handle table columns
      if (field.table) {
        const newTableId = generateId();
        const newColumns = field.table.columns.map((col) => {
          const newColId = generateId();
          return { ...col, id: newColId };
        });

        return {
          ...field,
          id: newFieldId,
          table: {
            ...field.table,
            id: newTableId,
            columns: newColumns
          }
        };
      }

      return { ...field, id: newFieldId };
    });

    return { ...section, id: newSectionId, fields: newFields };
  });

  return {
    document: {
      ...document,
      id: newDocId,
      sections: newSections
    },
    fieldIdMap
  };
}
