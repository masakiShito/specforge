import type { ReferenceKind } from "../enums/reference-kind.js";

export interface Reference {
  id: string;
  key: string;
  label: string;
  required: boolean;
  kind: ReferenceKind;
  targetId?: string;
  url?: string;
  description?: string;
}
