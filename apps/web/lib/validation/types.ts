import type { ValidationSeverity } from "../../types/validation";

/**
 * A single design-quality validation finding.
 * Contains enough information for display, navigation, and grouping.
 */
export interface DesignValidationIssue {
  /** Unique identifier for deduplication */
  id: string;
  severity: ValidationSeverity;
  /** Section ID for navigation */
  sectionId: string;
  sectionTitle: string;
  /** Field ID for navigation */
  fieldId: string;
  fieldLabel: string;
  /** Row index within a table (undefined for non-table issues) */
  rowIndex?: number;
  /** Column key within a table row */
  columnKey?: string;
  /** Short problem description */
  message: string;
  /** Why this is a problem */
  reason: string;
  /** How to fix it */
  fix: string;
}

/**
 * Context passed to every section validator.
 */
export interface TableValidationContext {
  sectionId: string;
  sectionTitle: string;
  fieldId: string;
  fieldLabel: string;
  tableKey: string;
}
