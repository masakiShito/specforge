import type {
  DesignValidationIssue,
  TableValidationContext,
} from "../types";
import {
  createIssue,
  validateDuplicateKeys,
  validateEmptyRows,
  validateRequiredTableFields,
  isCellEmpty,
  getDisplayValue,
} from "./common";

/**
 * Valid event trigger types (matching schema options)
 */
const VALID_TRIGGERS = [
  "onLoad",
  "onClick",
  "onChange",
  "onSubmit",
];

/**
 * Validate events table
 *
 * Expected columns (from screen-spec.ts):
 * - eventName (イベント名) - required
 * - triggerType (契機) - required
 * - actionType (処理種別) - required
 * - target (対象) - optional
 * - note (備考) - optional
 */
export function validateEvents(
  context: TableValidationContext
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  // Check for duplicate event names
  issues.push(...validateDuplicateKeys(context, "eventName", "イベント名"));

  // Check for empty rows
  issues.push(...validateEmptyRows(context, ["eventName", "triggerType"], "イベント"));

  // Check required fields
  issues.push(
    ...validateRequiredTableFields(context, [
      { key: "eventName", label: "イベント名" },
      { key: "triggerType", label: "契機" },
      { key: "actionType", label: "処理種別" },
    ])
  );

  // Validate event-specific rules
  context.rows.forEach((row, rowIndex) => {
    // Skip empty rows
    if (isCellEmpty(row["eventName"]) && isCellEmpty(row["triggerType"])) return;

    // Validate trigger type
    const triggerType = getDisplayValue(row["triggerType"]);
    if (triggerType && !VALID_TRIGGERS.includes(triggerType)) {
      issues.push(
        createIssue(
          `invalid-trigger-${rowIndex}`,
          "warning",
          `行${rowIndex + 1}の契機「${triggerType}」は標準的なイベントタイプではありません`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
            cellKey: "triggerType",
          }
        )
      );
    }

    // Check for API call references in action type
    const actionType = getDisplayValue(row["actionType"]);
    if (
      actionType.includes("API") ||
      actionType.includes("api") ||
      actionType.includes("送信") ||
      actionType.includes("取得")
    ) {
      if (isCellEmpty(row["target"])) {
        issues.push(
          createIssue(
            `event-api-reference-${rowIndex}`,
            "info",
            `行${rowIndex + 1}の処理種別にAPI呼び出しがありますが、対象が設定されていません`,
            {
              documentId: context.documentId,
              sectionKey: context.sectionKey,
              fieldKey: context.fieldKey,
              rowIndex,
              cellKey: "target",
            }
          )
        );
      }
    }
  });

  return issues;
}

/**
 * Check if the table is an events table
 */
export function isEventsTable(fieldKey: string): boolean {
  return (
    fieldKey === "events" ||
    fieldKey === "eventHandlers" ||
    fieldKey === "actions" ||
    fieldKey === "interactions"
  );
}
