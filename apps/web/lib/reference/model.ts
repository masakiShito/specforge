import type { Document, Field, Project, ReferenceKind } from "@specforge/document-schema";

import type { DocumentEditorState, TableRowValue } from "../document-editor/create-document-state";

export interface ReferenceValue {
  refId: string;
  kind: ReferenceKind;
  documentId: string;
  sectionId?: string;
  fieldId?: string;
  rowKey?: string;
}

export interface ReferenceCandidate {
  id: string;
  label: string;
  kind: ReferenceKind;
  documentId: string;
  sectionId?: string;
  fieldId?: string;
  rowKey?: string;
}

export interface ResolvedReference extends ReferenceCandidate {
  documentTitle: string;
}

export interface ReferenceCandidateFilter {
  kind: ReferenceKind;
  documentKinds?: Document["kind"][];
}

function toRowKey(row: TableRowValue, rowIndex: number, preferredKey: string): string {
  const preferred = row[preferredKey];
  if (typeof preferred === "string" && preferred.trim()) return preferred.trim();
  return `row-${rowIndex + 1}`;
}

function toReferenceCandidate(value: Omit<ResolvedReference, "documentTitle">): ReferenceCandidate {
  return value;
}

export function getReferenceCandidates(
  project: Project,
  states: Record<string, DocumentEditorState>,
  filter: ReferenceCandidateFilter
): ReferenceCandidate[] {
  const candidates: ReferenceCandidate[] = [];

  const targetDocuments = filter.documentKinds?.length
    ? project.documents.filter((doc) => filter.documentKinds!.includes(doc.kind))
    : project.documents;

  for (const document of targetDocuments) {
    if (filter.kind === "document") {
      candidates.push(toReferenceCandidate({
        id: document.id,
        label: document.title,
        kind: "document",
        documentId: document.id,
      }));
      continue;
    }

    const state = states[document.id];
    if (!state) continue;

    for (const section of document.sections) {
      for (const field of section.fields) {
        if (field.valueType !== "table" || !field.table) continue;

        const rows = Array.isArray(state.fieldValues[field.id]) ? (state.fieldValues[field.id] as TableRowValue[]) : [];
        rows.forEach((row, rowIndex) => {
          if (filter.kind === "field" && field.table?.key === "screen-fields") {
            const rowKey = toRowKey(row, rowIndex, "fieldKey");
            candidates.push(toReferenceCandidate({
              id: `${document.id}:field:${rowKey}`,
              label: `${document.title} / ${String(row.name ?? rowKey)}`,
              kind: "field",
              documentId: document.id,
              sectionId: section.id,
              fieldId: field.id,
              rowKey,
            }));
          }

          if (filter.kind === "event" && field.table?.key === "events") {
            const rowKey = toRowKey(row, rowIndex, "eventName");
            candidates.push(toReferenceCandidate({
              id: `${document.id}:event:${rowKey}`,
              label: `${document.title} / ${String(row.eventName ?? rowKey)}`,
              kind: "event",
              documentId: document.id,
              sectionId: section.id,
              fieldId: field.id,
              rowKey,
            }));
          }

          if (filter.kind === "message" && field.table?.key === "messages") {
            const rowKey = toRowKey(row, rowIndex, "messageId");
            candidates.push(toReferenceCandidate({
              id: `${document.id}:message:${rowKey}`,
              label: `${document.title} / ${String(row.messageId ?? rowKey)}`,
              kind: "message",
              documentId: document.id,
              sectionId: section.id,
              fieldId: field.id,
              rowKey,
            }));
          }
        });
      }
    }
  }

  return candidates;
}

export function resolveReference(
  project: Project,
  states: Record<string, DocumentEditorState>,
  reference: ReferenceValue
): ResolvedReference | undefined {
  const candidates = getReferenceCandidates(project, states, { kind: reference.kind });
  const hit = candidates.find((candidate) => candidate.id === reference.refId);
  if (!hit) return undefined;

  const document = project.documents.find((doc) => doc.id === hit.documentId);
  if (!document) return undefined;

  return {
    ...hit,
    documentTitle: document.title,
  };
}

export function isReferenceValue(value: unknown): value is ReferenceValue {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.refId === "string" &&
    typeof candidate.kind === "string" &&
    typeof candidate.documentId === "string"
  );
}

export function getReferenceLabel(
  project: Project,
  states: Record<string, DocumentEditorState>,
  reference: ReferenceValue | undefined,
  fallback = ""
): string {
  if (!reference) return fallback;
  return resolveReference(project, states, reference)?.label ?? fallback;
}

export function toReferenceValue(candidate: ReferenceCandidate): ReferenceValue {
  return {
    refId: candidate.id,
    kind: candidate.kind,
    documentId: candidate.documentId,
    sectionId: candidate.sectionId,
    fieldId: candidate.fieldId,
    rowKey: candidate.rowKey,
  };
}

export function getTableFieldByKey(document: Document, tableKey: string): { field: Field; sectionId: string } | undefined {
  for (const section of document.sections) {
    for (const field of section.fields) {
      if (field.valueType === "table" && field.table?.key === tableKey) {
        return { field, sectionId: section.id };
      }
    }
  }
  return undefined;
}
