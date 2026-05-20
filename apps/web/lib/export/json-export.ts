import type { Project, Document } from "@specforge/document-schema";
import type { DocumentEditorState, FieldValue } from "../document-editor/create-document-state";
import type { ProjectExportData, DocumentExportData, ExportResponse } from "./types";

const EXPORT_VERSION = "1.0.0";

/**
 * Export entire project with all document states to JSON
 */
export function exportProjectToJson(
  project: Project,
  documentStates: DocumentEditorState[]
): ExportResponse<string> {
  try {
    const exportData: ProjectExportData = {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      project,
      documentStates
    };

    const json = JSON.stringify(exportData, null, 2);
    return { success: true, data: json };
  } catch (error) {
    return {
      success: false,
      error: `Failed to export project: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Export a single document with its field values to JSON
 */
export function exportDocumentToJson(
  document: Document,
  fieldValues: Record<string, FieldValue>
): ExportResponse<string> {
  try {
    const exportData: DocumentExportData = {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      document,
      fieldValues
    };

    const json = JSON.stringify(exportData, null, 2);
    return { success: true, data: json };
  } catch (error) {
    return {
      success: false,
      error: `Failed to export document: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Generate filename for project export
 */
export function generateProjectFilename(project: Project): string {
  const sanitizedTitle = project.title.replace(/[^a-zA-Z0-9_-]/g, "_");
  const timestamp = new Date().toISOString().slice(0, 10);
  return `${sanitizedTitle}_${timestamp}.json`;
}

/**
 * Generate filename for document export
 */
export function generateDocumentFilename(document: Document): string {
  const sanitizedTitle = document.title.replace(/[^a-zA-Z0-9_-]/g, "_");
  const timestamp = new Date().toISOString().slice(0, 10);
  return `${sanitizedTitle}_${timestamp}.json`;
}
