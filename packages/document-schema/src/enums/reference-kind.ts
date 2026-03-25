export const referenceKinds = ["document", "field", "event", "message"] as const;

export type ReferenceKind = (typeof referenceKinds)[number];
