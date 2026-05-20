import type {
  DesignValidationIssue,
  TableValidationContext,
} from "../types";
import { isReferenceValue } from "../types";
import {
  createIssue,
  validateEmptyRows,
  validateRequiredTableFields,
  isCellEmpty,
  getDisplayValue,
} from "./common";

/**
 * Validate API connections table
 *
 * Expected columns (from screen-spec.ts):
 * - apiRef (API参照) - required, reference type
 * - timing (呼出タイミング) - required
 * - purpose (目的) - required
 * - inputSummary (主な入力) - optional
 * - outputSummary (主な出力) - optional
 * - note (備考) - optional
 */
export function validateApiConnections(
  context: TableValidationContext
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  // Check for empty rows
  issues.push(
    ...validateEmptyRows(context, ["apiRef", "timing"], "API連携")
  );

  // Check required fields
  issues.push(
    ...validateRequiredTableFields(context, [
      { key: "apiRef", label: "API参照" },
      { key: "timing", label: "呼出タイミング" },
      { key: "purpose", label: "目的" },
    ])
  );

  // Validate API connection-specific rules
  context.rows.forEach((row, rowIndex) => {
    // Skip empty rows
    if (isCellEmpty(row["apiRef"]) && isCellEmpty(row["timing"])) return;

    // Check if apiRef is a valid reference
    const apiRef = row["apiRef"];
    if (!isCellEmpty(apiRef) && !isReferenceValue(apiRef)) {
      issues.push(
        createIssue(
          `invalid-api-ref-${rowIndex}`,
          "warning",
          `行${rowIndex + 1}のAPI参照が正しく設定されていません。API仕様書への参照を選択してください`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
            cellKey: "apiRef",
          }
        )
      );
    }

    // Check if purpose is descriptive enough
    const purpose = getDisplayValue(row["purpose"]);
    if (purpose && purpose.length < 5) {
      issues.push(
        createIssue(
          `short-purpose-${rowIndex}`,
          "info",
          `行${rowIndex + 1}の目的が短すぎます。より詳細な説明を推奨します`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
            cellKey: "purpose",
          }
        )
      );
    }
  });

  return issues;
}

/**
 * Check if the table is an API connections table
 */
export function isApiConnectionsTable(fieldKey: string): boolean {
  return (
    fieldKey === "api-connections" ||
    fieldKey === "apiConnections" ||
    fieldKey === "apiCalls" ||
    fieldKey === "apiIntegrations" ||
    fieldKey === "externalApis"
  );
}
