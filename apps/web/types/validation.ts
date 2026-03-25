import type { ValidationWarning } from "../lib/document-editor/validate-document";

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationItem extends ValidationWarning {
  documentId?: string;
  rowIndex?: number;
  columnKey?: string;
  severity: ValidationSeverity;
  label?: string;
  reason?: string;
  fix?: string;
}
