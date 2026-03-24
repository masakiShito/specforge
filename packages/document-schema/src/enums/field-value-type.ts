export const fieldValueTypes = [
  "text",
  "textarea",
  "number",
  "boolean",
  "enum",
  "table",
  "reference"
] as const;

export type FieldValueType = (typeof fieldValueTypes)[number];
