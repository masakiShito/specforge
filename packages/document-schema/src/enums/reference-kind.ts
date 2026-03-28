export const referenceKinds = ["document", "api", "screen", "field", "event", "message"] as const;

export type ReferenceKind = (typeof referenceKinds)[number];
