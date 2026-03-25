import type { Document, DocumentKind } from "@specforge/document-schema";
import { screenSpecPreset, apiSpecPreset } from "@specforge/document-schema";

/**
 * Preset map keyed by document kind.
 * Add new presets here to support additional document types.
 */
const PRESET_MAP: Record<string, Document> = {
  "screen-spec": screenSpecPreset,
  "api-spec": apiSpecPreset,
};

/** Kinds available for document creation */
export const creatableKinds: { kind: DocumentKind; label: string }[] = [
  { kind: "screen-spec", label: "画面仕様書" },
  { kind: "api-spec", label: "API仕様書" },
];

let idCounter = 0;

function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

/**
 * Deep-clone a preset, assigning fresh unique IDs to every entity.
 * This ensures each created document is independent.
 */
function cloneWithFreshIds(preset: Document, docId: string): Document {
  return {
    ...preset,
    id: docId,
    key: `${preset.key}-${docId}`,
    sections: preset.sections.map((section) => {
      const sectionId = nextId("sec");
      return {
        ...section,
        id: sectionId,
        fields: section.fields.map((field) => {
          const fieldId = nextId("fld");
          return {
            ...field,
            id: fieldId,
            table: field.table
              ? {
                  ...field.table,
                  id: nextId("tbl"),
                  columns: field.table.columns.map((col) => ({
                    ...col,
                    id: nextId("col"),
                    options: col.options?.map((opt) => ({
                      ...opt,
                      id: nextId("opt"),
                    })),
                  })),
                  // Clear defaultRows for new documents — start empty
                  defaultRows: [],
                }
              : undefined,
            options: field.options?.map((opt) => ({
              ...opt,
              id: nextId("opt"),
            })),
          };
        }),
        references: section.references?.map((ref) => ({
          ...ref,
          id: nextId("ref"),
        })),
      };
    }),
  };
}

const DEFAULT_TITLES: Record<string, string> = {
  "screen-spec": "新しい画面仕様書",
  "api-spec": "新しいAPI仕様書",
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureUniqueTitle(baseTitle: string, existingDocs: Document[]): string {
  const used = new Set(existingDocs.map((doc) => doc.title));
  if (!used.has(baseTitle)) return baseTitle;

  let suffix = 2;
  while (used.has(`${baseTitle} ${suffix}`)) {
    suffix += 1;
  }
  return `${baseTitle} ${suffix}`;
}

function ensureUniqueKey(baseKey: string, existingDocs: Document[]): string {
  const used = new Set(existingDocs.map((doc) => doc.key));
  if (!used.has(baseKey)) return baseKey;

  let suffix = 2;
  while (used.has(`${baseKey}-${suffix}`)) {
    suffix += 1;
  }
  return `${baseKey}-${suffix}`;
}

/**
 * Create a new Document from a preset template.
 * Returns a document with unique IDs and a default title.
 */
export function createDocument(
  kind: DocumentKind,
  existingDocs: Document[] = [],
  title?: string
): Document {
  const preset = PRESET_MAP[kind];
  if (!preset) {
    throw new Error(`Unknown document kind: ${kind}`);
  }

  const docId = nextId("doc");
  const doc = cloneWithFreshIds(preset, docId);
  const baseTitle = title?.trim() || DEFAULT_TITLES[kind] || `新しい${kind}`;
  doc.title = ensureUniqueTitle(baseTitle, existingDocs);
  doc.key = ensureUniqueKey(slugify(doc.title) || `${kind}-doc`, existingDocs);
  doc.version = "0.1.0";
  doc.required = true;

  return doc;
}
