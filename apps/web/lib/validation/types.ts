import type { ValidationSeverity } from "../../types/validation";

export interface DesignValidationIssue {
  id: string;
  documentId: string;
  severity: ValidationSeverity;
  sectionId: string;
  sectionTitle: string;
  fieldId: string;
  fieldLabel: string;
  rowIndex?: number;
  columnKey?: string;
  referenceId?: string;
  message: string;
  reason: string;
  fix: string;
}

export interface TableValidationContext {
  documentId: string;
  sectionId: string;
  sectionTitle: string;
  fieldId: string;
  fieldLabel: string;
  tableKey: string;
}
