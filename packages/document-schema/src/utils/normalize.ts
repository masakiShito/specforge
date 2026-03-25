import type { Document } from "../core/document";
import type { Project } from "../core/project";

/**
 * Type guard: checks whether the input is a Project (has `documents` array).
 */
export function isProject(input: unknown): input is Project {
  if (typeof input !== "object" || input === null) return false;
  const obj = input as Record<string, unknown>;
  return Array.isArray(obj.documents) && typeof obj.title === "string" && typeof obj.id === "string";
}

/**
 * Type guard: checks whether the input is a standalone Document (has `kind` and `sections`).
 */
export function isDocument(input: unknown): input is Document {
  if (typeof input !== "object" || input === null) return false;
  const obj = input as Record<string, unknown>;
  return typeof obj.kind === "string" && Array.isArray(obj.sections) && !Array.isArray(obj.documents);
}

/**
 * Normalize any input into a Project.
 *
 * - If the input is already a Project, return it as-is.
 * - If the input is a standalone Document, wrap it in a single-document Project.
 * - Otherwise, throw an error.
 */
export function normalizeProjectData(input: Project | Document): Project {
  if (isProject(input)) {
    return input;
  }

  if (isDocument(input)) {
    return {
      id: `project-${input.id}`,
      key: `project-${input.key}`,
      title: input.title,
      required: true,
      documents: [input],
    };
  }

  throw new Error("normalizeProjectData: input is neither a Project nor a Document");
}
