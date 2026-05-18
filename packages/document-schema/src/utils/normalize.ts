import type { Document } from "../core/document";
import type { Project } from "../core/project";
import { ok, err, type Result } from "./result";

/**
 * Error types for normalization failures.
 */
export type NormalizeError =
  | { code: "INVALID_INPUT"; message: string }
  | { code: "NULL_INPUT"; message: string }
  | { code: "UNKNOWN_TYPE"; message: string };

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
 * Wrap a Document in a Project structure.
 */
function wrapDocumentInProject(document: Document): Project {
  return {
    id: `project-${document.id}`,
    key: `project-${document.key}`,
    title: document.title,
    required: true,
    documents: [document],
  };
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
    return wrapDocumentInProject(input);
  }

  throw new Error("normalizeProjectData: input is neither a Project nor a Document");
}

/**
 * Safe version of normalizeProjectData that returns a Result instead of throwing.
 *
 * Use this when you need to handle invalid input gracefully without exceptions.
 *
 * @example
 * const result = safeNormalizeProjectData(input);
 * if (result.ok) {
 *   const project = result.value;
 * } else {
 *   console.error(result.error.message);
 * }
 */
export function safeNormalizeProjectData(
  input: unknown
): Result<Project, NormalizeError> {
  if (input === null) {
    return err({
      code: "NULL_INPUT",
      message: "Input is null",
    });
  }

  if (input === undefined) {
    return err({
      code: "NULL_INPUT",
      message: "Input is undefined",
    });
  }

  if (typeof input !== "object") {
    return err({
      code: "INVALID_INPUT",
      message: `Expected object, got ${typeof input}`,
    });
  }

  if (isProject(input)) {
    return ok(input);
  }

  if (isDocument(input)) {
    return ok(wrapDocumentInProject(input));
  }

  return err({
    code: "UNKNOWN_TYPE",
    message: "Input is neither a Project nor a Document",
  });
}
