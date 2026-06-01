/**
 * Validation severity levels.
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * Reference value used by the web editor.
 */
export interface ReferenceValue {
  refId?: string;
  kind?: string;
  documentId?: string;
  sectionId?: string;
  fieldId?: string;
  rowKey?: string;
  type?: 'reference';
  referenceType?: string;
  targetDocumentId?: string;
  targetKey?: string;
  displayValue?: string;
}

export type LegacyReferenceValue = ReferenceValue;
export type AnyReferenceValue = ReferenceValue;

// Kept permissive because older package APIs used this name for a cell value,
// while web validation rules use it for a row object.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TableRowCellValue = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TableRowValue = any;

/**
 * Type guard to check if a value is a supported reference value.
 */
export function isReferenceValue(value: unknown): value is AnyReferenceValue {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  const isWebReference =
    typeof obj['refId'] === 'string' &&
    typeof obj['kind'] === 'string' &&
    typeof obj['documentId'] === 'string';
  const isLegacyReference =
    obj['type'] === 'reference' &&
    typeof obj['referenceType'] === 'string' &&
    typeof obj['targetDocumentId'] === 'string' &&
    typeof obj['targetKey'] === 'string' &&
    typeof obj['displayValue'] === 'string';
  return isWebReference || isLegacyReference;
}

/**
 * Validation issue returned by lint rules. This matches apps/web validation
 * issues while retaining legacy aliases for existing lint-rules consumers.
 */
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
  sectionKey?: string;
  fieldKey?: string;
  cellKey?: string;
}

/**
 * Context passed to table validation rules.
 */
export interface TableValidationContext {
  documentId: string;
  sectionId?: string;
  sectionTitle?: string;
  fieldId?: string;
  fieldLabel?: string;
  tableKey?: string;
  sectionKey?: string;
  fieldKey?: string;
  rows?: TableRowValue[];
  columns?: TableColumnDefinition[];
}

/**
 * Column definition for table validation.
 */
export interface TableColumnDefinition {
  id?: string;
  key: string;
  label: string;
  type?: string;
  valueType?: string;
  required?: boolean;
}

/**
 * Validation rule interface.
 */
export interface ValidationRule {
  id: string;
  name: string;
  description?: string;
  severity: ValidationSeverity;
  validate: (context: ValidationRuleContext) => DesignValidationIssue[];
}

/**
 * Context passed to validation rules.
 */
export interface ValidationRuleContext {
  documentId: string;
  documentKind: string;
  sections: SectionContext[];
}

export interface SectionContext {
  key: string;
  title: string;
  fields: FieldContext[];
}

export interface FieldContext {
  key: string;
  type: string;
  value: unknown;
  label?: string;
  required?: boolean;
}

export interface ValidationResult {
  issues: DesignValidationIssue[];
  isValid: boolean;
  errorCount: number;
  warningCount: number;
  infoCount: number;
}
