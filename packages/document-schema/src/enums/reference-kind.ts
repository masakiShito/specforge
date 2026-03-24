export const referenceKinds = ["document", "section", "field", "external"] as const;

export type ReferenceKind = (typeof referenceKinds)[number];
