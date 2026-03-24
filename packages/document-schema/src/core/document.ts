import type { DocumentKind } from "../enums/document-kind.js";
import type { Section } from "./section.js";

export interface Document {
  id: string;
  key: string;
  title: string;
  required: boolean;
  kind: DocumentKind;
  version: string;
  sections: Section[];
  tags?: string[];
}
