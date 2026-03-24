import type { DocumentKind } from "../enums/document-kind";
import type { Section } from "./section";

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
