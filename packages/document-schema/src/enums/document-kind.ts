export const documentKinds = [
  "screen-spec",
  "api-spec",
  "er-spec",
  "business-rule"
] as const;

export type DocumentKind = (typeof documentKinds)[number];
