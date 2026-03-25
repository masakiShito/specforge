import type { ValidationWarning } from "../lib/document-editor/validate-document";

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationItem extends ValidationWarning {
  severity: ValidationSeverity;
  label?: string;
  reason?: string;
  fix?: string;
}
