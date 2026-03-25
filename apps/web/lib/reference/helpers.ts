import type { Document, Project } from "@specforge/document-schema";

/**
 * Get all api-spec documents from a project.
 */
export function getApiDocuments(project: Project): Document[] {
  return project.documents.filter((doc) => doc.kind === "api-spec");
}

/**
 * Get a document by ID from a project.
 */
export function getDocumentById(project: Project, documentId: string): Document | undefined {
  return project.documents.find((doc) => doc.id === documentId);
}

/**
 * Build a list of selectable API reference options for use in table dropdowns.
 */
export function getApiReferenceOptions(
  project: Project
): { id: string; value: string; label: string }[] {
  return getApiDocuments(project).map((doc) => ({
    id: `ref-${doc.id}`,
    value: doc.id,
    label: doc.title,
  }));
}
