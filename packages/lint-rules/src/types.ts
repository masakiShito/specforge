/**
 * Validation severity levels
 */
export type ValidationSeverity = "error" | "warning" | "info";

/**
 * Possible cell value types in a table row
 */
export type TableRowValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ReferenceValue
  | TableRowValue[];

/**
 * Reference value type for cross-document references
 */
export interface ReferenceValue {
  type: "reference";
  referenceType: string;
  targetDocumentId: string;
  targetKey: string;
  displayValue: string;
}

/**
 * Type guard to check if a value is a ReferenceValue
 */
export function isReferenceValue(value: unknown): value is ReferenceValue {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    obj["type"] === "reference" &&
    typeof obj["referenceType"] === "string" &&
    typeof obj["targetDocumentId"] === "string" &&
    typeof obj["targetKey"] === "string" &&
    typeof obj["displayValue"] === "string"
  );
}

/**
 * Validation issue returned by lint rules
 */
export interface DesignValidationIssue {
  id: string;
  severity: ValidationSeverity;
  message: string;
  documentId?: string;
  sectionKey?: string;
  fieldKey?: string;
  rowIndex?: number;
  cellKey?: string;
}

/**
 * Context passed to table validation rules
 */
export interface TableValidationContext {
  documentId: string;
  sectionKey: string;
  fieldKey: string;
  rows: Record<string, TableRowValue>[];
  columns: TableColumnDefinition[];
}

/**
 * Column definition for table validation
 */
export interface TableColumnDefinition {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
}

/**
 * Validation rule interface
 */
export interface ValidationRule {
  id: string;
  name: string;
  description?: string;
  severity: ValidationSeverity;
  validate: (context: ValidationRuleContext) => DesignValidationIssue[];
}

/**
 * Context passed to validation rules
 */
export interface ValidationRuleContext {
  documentId: string;
  documentKind: string;
  sections: SectionContext[];
}

/**
 * Section context for validation
 */
export interface SectionContext {
  key: string;
  title: string;
  fields: FieldContext[];
}

/**
 * Field context for validation
 */
export interface FieldContext {
  key: string;
  type: string;
  value: unknown;
  label?: string;
  required?: boolean;
}

/**
 * Validation result containing all issues
 */
export interface ValidationResult {
  issues: DesignValidationIssue[];
  isValid: boolean;
  errorCount: number;
  warningCount: number;
  infoCount: number;
}
