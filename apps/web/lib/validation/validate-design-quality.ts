import type { Field, Project } from '@specforge/document-schema';
import {
  validateScreenFields,
  validateEvents,
  validateMessages,
  validateApiConnections,
  validateRequestParameters,
  validateResponseParameters,
  validateErrorResponses,
  validateApiSpecFields,
  validateReferenceIntegrity,
  validateEntities,
  validateAttributes,
  validateRelationships,
  validateIndexes,
  validateConditions,
  validateRules,
  validateExceptions,
  validateValidations,
} from '@specforge/lint-rules';

import type { DocumentEditorState, TableRowValue } from '../document-editor/create-document-state';
import type { DesignValidationIssue, TableValidationContext } from './types';
import {
  getCachedDocumentValidation,
  getCachedProjectValidation,
  hashProject,
} from './validation-cache';

const TABLE_VALIDATORS: Record<
  string,
  (rows: TableRowValue[], columns: Field[], ctx: TableValidationContext) => DesignValidationIssue[]
> = {
  // screen-spec tables
  'screen-fields': validateScreenFields,
  events: validateEvents,
  messages: validateMessages,
  'api-connections': validateApiConnections,
  // api-spec tables
  'request-parameters': validateRequestParameters,
  'response-parameters': validateResponseParameters,
  'error-responses': validateErrorResponses,
  // er-spec tables
  entities: validateEntities,
  attributes: validateAttributes,
  relationships: validateRelationships,
  indexes: validateIndexes,
  // business-rule tables
  conditions: validateConditions,
  rules: validateRules,
  exceptions: validateExceptions,
  validations: validateValidations,
};

export interface DesignQualityResult {
  issues: DesignValidationIssue[];
  issueCountBySection: Record<string, { error: number; warning: number; info: number }>;
}

export interface ProjectValidationResult {
  issues: DesignValidationIssue[];
  issueCountByDocument: Record<string, { error: number; warning: number; info: number }>;
}

/**
 * Internal validation logic (uncached)
 */
function computeDesignQuality(state: DocumentEditorState, project?: Project): DesignQualityResult {
  const issues: DesignValidationIssue[] = [];
  const issueCountBySection: Record<string, { error: number; warning: number; info: number }> = {};

  for (const section of state.document.sections) {
    const sectionCounts = { error: 0, warning: 0, info: 0 };

    for (const field of section.fields) {
      if (field.valueType !== 'table' || !field.table) continue;
      const rows = Array.isArray(state.fieldValues[field.id])
        ? (state.fieldValues[field.id] as TableRowValue[])
        : [];
      const validator = TABLE_VALIDATORS[field.table.key];
      if (!validator) continue;

      const ctx: TableValidationContext = {
        documentId: state.document.id,
        sectionId: section.id,
        sectionTitle: section.title,
        fieldId: field.id,
        fieldLabel: field.label,
        tableKey: field.table.key,
      };
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

/**
 * Validate design quality for a single document
 * Results are cached based on document state
 */
export function validateDesignQuality(
  state: DocumentEditorState,
  project?: Project
): DesignQualityResult {
  const extraKey = project ? hashProject(project) : undefined;
  return getCachedDocumentValidation(state, () => computeDesignQuality(state, project), extraKey);
}

/**
 * Internal project validation logic (uncached)
 */
function computeProjectQuality(
  project: Project,
  states: Record<string, DocumentEditorState>
): ProjectValidationResult {
  const issues: DesignValidationIssue[] = [];
  const issueCountByDocument: Record<string, { error: number; warning: number; info: number }> = {};

  for (const document of project.documents) {
    const state = states[document.id];
    if (!state) continue;

    const result = computeDesignQuality(state, project);
    result.issues.forEach((issue) => {
      issues.push(issue);
      const counts = issueCountByDocument[issue.documentId] ?? { error: 0, warning: 0, info: 0 };
      counts[issue.severity]++;
      issueCountByDocument[issue.documentId] = counts;
    });
  }

  return { issues, issueCountByDocument };
}

/**
 * Validate design quality for an entire project
 * Results are cached based on all document states
 */
export function validateProjectQuality(
  project: Project,
  states: Record<string, DocumentEditorState>
): ProjectValidationResult {
  return getCachedProjectValidation(states, () => computeProjectQuality(project, states));
}
