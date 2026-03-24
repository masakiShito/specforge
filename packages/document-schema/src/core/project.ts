import type { Document } from "./document.js";

export interface Project {
  id: string;
  key: string;
  title: string;
  required: boolean;
  description?: string;
  documents: Document[];
}
