import type { Field } from "@specforge/document-schema";

import type { DocumentEditorState, TableRowValue } from "../document-editor/create-document-state";
import type { DesignValidationIssue, TableValidationContext } from "./types";
import { validateScreenFields } from "./rules/screen-fields";
import { validateEvents } from "./rules/events";
import { validateMessages } from "./rules/messages";
import { validateApiConnections } from "./rules/api-connections";

/**
 * Map of table key → section-specific validator.
 *
 * To add cross-section validation in the future, add a post-processing step
 * that receives the full DocumentEditorState and all per-section issues.
 */
const TABLE_VALIDATORS: Record<
  string,
  (rows: TableRowValue[], columns: Field[], ctx: TableValidationContext) => DesignValidationIssue[]
> = {
  "screen-fields": validateScreenFields,
  events: validateEvents,
  messages: validateMessages,
  "api-connections": validateApiConnections,
};

export interface DesignQualityResult {
  issues: DesignValidationIssue[];
  /** Issue counts per section for left-pane badge display */
  issueCountBySection: Record<string, { error: number; warning: number; info: number }>;
}

/**
 * Run all design-quality validators against the current editor state.
 *
 * This function is intentionally separate from the existing `validateDocument`
 * so that the two systems can coexist and be merged gradually.
 *
 * ### Extension points for future cross-section validation:
 * 1. After collecting per-table issues, add a `validateCrossSection(state, allIssues)` call.
 * 2. Cross-section validators can check references between tables, e.g.:
 *    - Event targets referencing fieldKeys from Screen Fields
 *    - Message conditions referencing event names
 *    - API connections referenced from Events
 */
export function validateDesignQuality(state: DocumentEditorState): DesignQualityResult {
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

  // Future: cross-section validation hook
  // issues.push(...validateCrossSection(state, issues));

  return { issues, issueCountBySection };
}
