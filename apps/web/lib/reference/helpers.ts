import type { DocumentKind, Project, Reference } from "@specforge/document-schema";

import type { DocumentEditorState } from "../document-editor/create-document-state";
import {
  getReferenceCandidates,
  getReferenceLabel,
  resolveReference,
  toReferenceValue,
  type ReferenceCandidate,
  type ReferenceCandidateFilter,
  type ReferenceValue,
} from "./model";

export function getApiReferenceCandidates(
  project: Project,
  states: Record<string, DocumentEditorState>
) {
  return getReferenceCandidates(project, states, {
    kind: "document",
    documentKinds: ["api-spec"],
  });
}

/**
 * Build a ReferenceCandidateFilter from a Field's reference metadata.
 */
export function buildFilterFromReference(ref: Reference): ReferenceCandidateFilter {
  return {
    kind: ref.kind,
    documentKinds: ref.constraint?.documentKinds,
  };
}

/**
 * Get reference candidates based on a Field's reference metadata.
 */
export function getCandidatesForReference(
  project: Project,
  states: Record<string, DocumentEditorState>,
  ref: Reference
): ReferenceCandidate[] {
  return getReferenceCandidates(project, states, buildFilterFromReference(ref));
}

export function toApiReferenceValue(
  project: Project,
  states: Record<string, DocumentEditorState>,
  documentId: string
): ReferenceValue | undefined {
  const candidate = getApiReferenceCandidates(project, states).find((item) => item.documentId === documentId);
  return candidate ? toReferenceValue(candidate) : undefined;
}

export function resolveReferenceLabel(
  project: Project,
  states: Record<string, DocumentEditorState>,
  reference: ReferenceValue | undefined,
  fallback = ""
): string {
  return getReferenceLabel(project, states, reference, fallback);
}

export function resolveReferenceTarget(
  project: Project,
  states: Record<string, DocumentEditorState>,
  reference: ReferenceValue
) {
  return resolveReference(project, states, reference);
}
