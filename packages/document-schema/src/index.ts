export type { Project } from "./core/project";
export type { Document } from "./core/document";
export type { Section } from "./core/section";
export type { Field, FieldOption } from "./core/field";
export type { Table, TableRowValue } from "./core/table";
export type { Reference } from "./core/reference";

export { documentKinds } from "./enums/document-kind";
export type { DocumentKind } from "./enums/document-kind";
export { fieldValueTypes } from "./enums/field-value-type";
export type { FieldValueType } from "./enums/field-value-type";
export { referenceKinds } from "./enums/reference-kind";
export type { ReferenceKind } from "./enums/reference-kind";

export { screenSpecPreset } from "./presets/screen-spec";
export { apiSpecPreset } from "./presets/api-spec";

export { sampleScreenSpecProject } from "./samples/sample-screen-spec";

export { isProject, isDocument, normalizeProjectData } from "./utils/normalize";
