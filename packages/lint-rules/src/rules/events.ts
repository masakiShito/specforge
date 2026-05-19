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
 * Valid event trigger types
 */
const VALID_TRIGGERS = [
  "click",
  "submit",
  "change",
  "blur",
  "focus",
  "load",
  "scroll",
  "keypress",
  "keydown",
  "keyup",
  "hover",
  "drag",
  "drop",
  "mount",
  "unmount",
  "timer",
  "custom",
];

/**
 * Validate events table
 */
export function validateEvents(
  context: TableValidationContext
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  // Check for duplicate event IDs
  issues.push(...validateDuplicateKeys(context, "id", "イベントID"));

  // Check for empty rows
  issues.push(...validateEmptyRows(context, ["id", "trigger"], "イベント"));

  // Check required fields
  issues.push(
    ...validateRequiredTableFields(context, [
      { key: "id", label: "イベントID" },
      { key: "trigger", label: "トリガー" },
      { key: "action", label: "アクション" },
    ])
  );

  // Validate event-specific rules
  context.rows.forEach((row, rowIndex) => {
    // Skip empty rows
    if (isCellEmpty(row.id) && isCellEmpty(row.trigger)) return;

    // Validate trigger type
    const trigger = getDisplayValue(row.trigger).toLowerCase();
    if (trigger && !VALID_TRIGGERS.includes(trigger)) {
      issues.push(
        createIssue(
          `invalid-trigger-${rowIndex}`,
          "warning",
          `行${rowIndex + 1}のトリガー「${trigger}」は標準的なイベントタイプではありません`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
            cellKey: "trigger",
          }
        )
      );
    }

    // Check if condition is set for conditional events
    const action = getDisplayValue(row.action);
    if (
      action.includes("条件") ||
      action.includes("場合") ||
      action.includes("if")
    ) {
      if (isCellEmpty(row.condition)) {
        issues.push(
          createIssue(
            `missing-condition-${rowIndex}`,
            "info",
            `行${rowIndex + 1}のアクションに条件分岐がありますが、条件カラムが未設定です`,
            {
              documentId: context.documentId,
              sectionKey: context.sectionKey,
              fieldKey: context.fieldKey,
              rowIndex,
              cellKey: "condition",
            }
          )
        );
      }
    }

    // Check for API call references
    if (
      action.includes("API") ||
      action.includes("api") ||
      action.includes("送信") ||
      action.includes("取得")
    ) {
      if (isCellEmpty(row.apiConnection) && isCellEmpty(row.targetApi)) {
        issues.push(
          createIssue(
            `event-api-reference-${rowIndex}`,
            "info",
            `行${rowIndex + 1}のアクションにAPI呼び出しがありますが、API連携の参照が設定されていません`,
            {
              documentId: context.documentId,
              sectionKey: context.sectionKey,
              fieldKey: context.fieldKey,
              rowIndex,
            }
          )
        );
      }
    }

    // Validate event ID format
    const eventId = getDisplayValue(row.id);
    if (eventId && !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(eventId)) {
      issues.push(
        createIssue(
          `invalid-event-id-format-${rowIndex}`,
          "warning",
          `行${rowIndex + 1}のイベントID「${eventId}」は英字で始まり、英数字・ハイフン・アンダースコアのみを含む形式を推奨します`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
            cellKey: "id",
          }
        )
      );
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
