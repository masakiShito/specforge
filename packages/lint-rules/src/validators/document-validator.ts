import type {
  DesignValidationIssue,
  ValidationResult,
  TableValidationContext,
  TableRowValue,
} from "../types";
import {
  validateScreenFields,
  isScreenFieldsTable,
  validateEvents,
  isEventsTable,
  validateMessages,
  isMessagesTable,
  validateApiConnections,
  isApiConnectionsTable,
  validateApiSpecEndpoints,
  isApiSpecEndpointsTable,
  validateRequestParams,
  validateResponseSchema,
  validateErrorResponses,
  isRequestParamsTable,
  isResponseSchemaTable,
  isErrorResponsesTable,
} from "../rules";

/**
 * Document structure for validation
 */
export interface ValidatableDocument {
  id: string;
  kind: string;
  title: string;
  sections: ValidatableSection[];
}

/**
 * Section structure for validation
 */
export interface ValidatableSection {
  key: string;
  title: string;
  fields: ValidatableField[];
}

/**
 * Field structure for validation
 */
export interface ValidatableField {
  key: string;
  type: string;
  value: unknown;
  label?: string;
  required?: boolean;
  columns?: { key: string; label: string }[];
}

/**
 * Validate a single document
 */
export function validateDocument(
  document: ValidatableDocument
): ValidationResult {
  const issues: DesignValidationIssue[] = [];

  document.sections.forEach((section) => {
    section.fields.forEach((field) => {
      if (field.type === "table" && Array.isArray(field.value)) {
        const tableContext: TableValidationContext = {
          documentId: document.id,
          sectionKey: section.key,
          fieldKey: field.key,
          rows: field.value as Record<string, TableRowValue>[],
          columns: field.columns || [],
        };

        // Apply appropriate validation rules based on field key
        issues.push(...validateTableField(tableContext, document.kind));
      }
    });
  });

  return createValidationResult(issues);
}

/**
 * Validate a table field with appropriate rules
 */
function validateTableField(
  context: TableValidationContext,
  documentKind: string
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];
  const fieldKey = context.fieldKey;

  // Screen spec validations
  if (documentKind === "screen-spec") {
    if (isScreenFieldsTable(fieldKey)) {
      issues.push(...validateScreenFields(context));
    }
    if (isEventsTable(fieldKey)) {
      issues.push(...validateEvents(context));
    }
    if (isMessagesTable(fieldKey)) {
      issues.push(...validateMessages(context));
    }
    if (isApiConnectionsTable(fieldKey)) {
      issues.push(...validateApiConnections(context));
    }
  }

  // API spec validations
  if (documentKind === "api-spec") {
    if (isApiSpecEndpointsTable(fieldKey)) {
      issues.push(...validateApiSpecEndpoints(context));
    }
    if (isRequestParamsTable(fieldKey)) {
      issues.push(...validateRequestParams(context));
    }
    if (isResponseSchemaTable(fieldKey)) {
      issues.push(...validateResponseSchema(context));
    }
    if (isErrorResponsesTable(fieldKey)) {
      issues.push(...validateErrorResponses(context));
    }
  }

  // Common validations for any document type
  if (isApiConnectionsTable(fieldKey)) {
    issues.push(...validateApiConnections(context));
  }

  return issues;
}

/**
 * Create a validation result from issues
 */
function createValidationResult(
  issues: DesignValidationIssue[]
): ValidationResult {
  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const infoCount = issues.filter((i) => i.severity === "info").length;

  return {
    issues,
    isValid: errorCount === 0,
    errorCount,
    warningCount,
    infoCount,
  };
}

/**
 * Validate multiple documents
 */
export function validateDocuments(
  documents: ValidatableDocument[]
): ValidationResult {
  const allIssues: DesignValidationIssue[] = [];

  documents.forEach((doc) => {
    const result = validateDocument(doc);
    allIssues.push(...result.issues);
  });

  return createValidationResult(allIssues);
}
