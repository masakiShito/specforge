import type { Field, Project } from "@specforge/document-schema";

import type { DocumentEditorState, TableRowValue } from "../document-editor/create-document-state";
import type { DesignValidationIssue, TableValidationContext } from "./types";
import { validateScreenFields } from "./rules/screen-fields";
import { validateEvents } from "./rules/events";
import { validateMessages } from "./rules/messages";
import { validateApiConnections } from "./rules/api-connections";
import { validateRequestParameters, validateResponseParameters, validateErrorResponses } from "./rules/api-spec-tables";
import { validateApiSpecFields } from "./rules/api-spec-endpoint";
import { validateReferenceIntegrity } from "./rules/reference-integrity";

/**
 * Map of table key → section-specific validator.
 */
const TABLE_VALIDATORS: Record<
  string,
  (rows: TableRowValue[], columns: Field[], ctx: TableValidationContext) => DesignValidationIssue[]
> = {
  "screen-fields": validateScreenFields,
  events: validateEvents,
  messages: validateMessages,
  "api-connections": validateApiConnections,
  "request-parameters": validateRequestParameters,
  "response-parameters": validateResponseParameters,
  "error-responses": validateErrorResponses,
};

export interface DesignQualityResult {
  issues: DesignValidationIssue[];
  /** Issue counts per section for left-pane badge display */
  issueCountBySection: Record<string, { error: number; warning: number; info: number }>;
}

/**
 * Run all design-quality validators against the current editor state.
 *
 * @param state - The current document editor state
 * @param project - Optional project for cross-document reference validation
 */
export function validateDesignQuality(
  state: DocumentEditorState,
  project?: Project
): DesignQualityResult {
  const issues: DesignValidationIssue[] = [];
  const issueCountBySection: Record<string, { error: number; warning: number; info: number }> = {};

  for (const section of state.document.sections) {
    const sectionCounts = { error: 0, warning: 0, info: 0 };

    for (const field of section.fields) {
      if (field.valueType !== "table" || !field.table) continue;

      const rows = Array.isArray(state.fieldValues[field.id])
        ? (state.fieldValues[field.id] as TableRowValue[])
        : [];

      const tableKey = field.table.key;
      const validator = TABLE_VALIDATORS[tableKey];
      if (!validator) continue;

      const ctx: TableValidationContext = {
        sectionId: section.id,
        sectionTitle: section.title,
        fieldId: field.id,
        fieldLabel: field.label,
        tableKey,
      };

      const tableIssues = validator(rows, field.table.columns, ctx);
      issues.push(...tableIssues);

      for (const issue of tableIssues) {
        sectionCounts[issue.severity]++;
      }
    }

    issueCountBySection[section.id] = sectionCounts;
  }

  // API-spec field-level validation
  const apiSpecIssues = validateApiSpecFields(state);
  for (const issue of apiSpecIssues) {
    issues.push(issue);
    const counts = issueCountBySection[issue.sectionId] ?? { error: 0, warning: 0, info: 0 };
    counts[issue.severity]++;
    issueCountBySection[issue.sectionId] = counts;
  }

  // Cross-document reference integrity validation
  if (project) {
    const refIssues = validateReferenceIntegrity(state, project);
    for (const issue of refIssues) {
      issues.push(issue);
      const counts = issueCountBySection[issue.sectionId] ?? { error: 0, warning: 0, info: 0 };
      counts[issue.severity]++;
      issueCountBySection[issue.sectionId] = counts;
    }
  }

  return { issues, issueCountBySection };
}
