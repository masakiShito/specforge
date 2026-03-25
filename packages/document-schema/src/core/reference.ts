import type { DocumentKind } from "../enums/document-kind";
import type { ReferenceKind } from "../enums/reference-kind";

export interface ReferenceConstraint {
  kinds?: ReferenceKind[];
  documentKinds?: DocumentKind[];
}

/**
 * Field metadata that describes how a reference picker should behave.
 * NOTE: actual selected value is stored in editor state as a structured reference value.
 */
export interface Reference {
  id: string;
  key: string;
  label: string;
  required: boolean;
  kind: ReferenceKind;
  description?: string;
  constraint?: ReferenceConstraint;
}
