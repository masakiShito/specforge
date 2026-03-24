import type { ReferenceKind } from "../enums/reference-kind";

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
