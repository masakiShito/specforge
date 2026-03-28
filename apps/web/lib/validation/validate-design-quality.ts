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

const TABLE_VALIDATORS: Record<string, (rows: TableRowValue[], columns: Field[], ctx: TableValidationContext) => DesignValidationIssue[]> = {
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
  issueCountBySection: Record<string, { error: number; warning: number; info: number }>;
}

export interface ProjectValidationResult {
  issues: DesignValidationIssue[];
  issueCountByDocument: Record<string, { error: number; warning: number; info: number }>;
}

export function validateDesignQuality(state: DocumentEditorState, project?: Project): DesignQualityResult {
  const issues: DesignValidationIssue[] = [];
  const issueCountBySection: Record<string, { error: number; warning: number; info: number }> = {};

  for (const section of state.document.sections) {
    const sectionCounts = { error: 0, warning: 0, info: 0 };

    for (const field of section.fields) {
      if (field.valueType !== "table" || !field.table) continue;
      const rows = Array.isArray(state.fieldValues[field.id]) ? (state.fieldValues[field.id] as TableRowValue[]) : [];
      const validator = TABLE_VALIDATORS[field.table.key];
      if (!validator) continue;

      const ctx: TableValidationContext = { documentId: state.document.id, sectionId: section.id, sectionTitle: section.title, fieldId: field.id, fieldLabel: field.label, tableKey: field.table.key };
      const tableIssues = validator(rows, field.table.columns, ctx);
      issues.push(...tableIssues);
      tableIssues.forEach((issue) => sectionCounts[issue.severity]++);
    }

    issueCountBySection[section.id] = sectionCounts;
  }

  const apiSpecIssues = validateApiSpecFields(state);
  apiSpecIssues.forEach((issue) => {
    issues.push(issue);
    const counts = issueCountBySection[issue.sectionId] ?? { error: 0, warning: 0, info: 0 };
    counts[issue.severity]++;
    issueCountBySection[issue.sectionId] = counts;
  });

  if (project) {
    const refIssues = validateReferenceIntegrity(state, project);
    refIssues.forEach((issue) => {
      issues.push(issue);
      const counts = issueCountBySection[issue.sectionId] ?? { error: 0, warning: 0, info: 0 };
      counts[issue.severity]++;
      issueCountBySection[issue.sectionId] = counts;
    });
  }

  return { issues, issueCountBySection };
}

export function validateProjectQuality(project: Project, states: Record<string, DocumentEditorState>): ProjectValidationResult {
  const issues: DesignValidationIssue[] = [];
  const issueCountByDocument: Record<string, { error: number; warning: number; info: number }> = {};

  for (const document of project.documents) {
    const state = states[document.id];
    if (!state) continue;

    const result = validateDesignQuality(state, project);
    result.issues.forEach((issue) => {
      issues.push(issue);
      const counts = issueCountByDocument[issue.documentId] ?? { error: 0, warning: 0, info: 0 };
      counts[issue.severity]++;
      issueCountByDocument[issue.documentId] = counts;
    });
  }

  return { issues, issueCountByDocument };
}
