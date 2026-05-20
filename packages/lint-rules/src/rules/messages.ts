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
 * Valid message types (matching schema options)
 */
const VALID_MESSAGE_TYPES = [
  "info",
  "warning",
  "error",
  "confirm",
];

/**
 * Validate messages table
 *
 * Expected columns (from screen-spec.ts):
 * - messageId (メッセージID) - required
 * - messageType (種別) - required
 * - condition (表示条件) - optional
 * - messageText (文言) - required
 * - note (備考) - optional
 */
export function validateMessages(
  context: TableValidationContext
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  // Check for duplicate message IDs
  issues.push(...validateDuplicateKeys(context, "messageId", "メッセージID"));

  // Check for empty rows
  issues.push(...validateEmptyRows(context, ["messageId", "messageText"], "メッセージ"));

  // Check required fields
  issues.push(
    ...validateRequiredTableFields(context, [
      { key: "messageId", label: "メッセージID" },
      { key: "messageType", label: "種別" },
      { key: "messageText", label: "文言" },
    ])
  );

  // Validate message-specific rules
  context.rows.forEach((row, rowIndex) => {
    // Skip empty rows
    if (isCellEmpty(row["messageId"]) && isCellEmpty(row["messageText"])) return;

    // Validate message type
    const messageType = getDisplayValue(row["messageType"]);
    if (messageType && !VALID_MESSAGE_TYPES.includes(messageType)) {
      issues.push(
        createIssue(
          `invalid-message-type-${rowIndex}`,
          "info",
          `行${rowIndex + 1}の種別「${messageType}」は標準的なタイプではありません`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
            cellKey: "messageType",
          }
        )
      );
    }

    // Check message content for potential issues
    const messageText = getDisplayValue(row["messageText"]);

    // Check for very short messages
    if (messageText && messageText.length < 5) {
      issues.push(
        createIssue(
          `short-message-${rowIndex}`,
          "info",
          `行${rowIndex + 1}の文言が短すぎる可能性があります`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
            cellKey: "messageText",
          }
        )
      );
    }

    // Check for placeholder patterns that might not have been replaced
    if (messageText && /{{\s*\w+\s*}}/.test(messageText)) {
      issues.push(
        createIssue(
          `undocumented-placeholders-${rowIndex}`,
          "warning",
          `行${rowIndex + 1}の文言にプレースホルダーがありますが、ドキュメント化されていません`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
            cellKey: "messageText",
          }
        )
      );
    }

    // Check for error type without trigger condition
    if (messageType === "error") {
      if (isCellEmpty(row["condition"])) {
        issues.push(
          createIssue(
            `error-without-condition-${rowIndex}`,
            "info",
            `行${rowIndex + 1}のエラーメッセージに表示条件が設定されていません`,
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

    // Validate message ID format
    const messageId = getDisplayValue(row["messageId"]);
    if (messageId && !/^[A-Z][A-Z0-9_]*$/.test(messageId)) {
      issues.push(
        createIssue(
          `invalid-message-id-format-${rowIndex}`,
          "info",
          `行${rowIndex + 1}のメッセージID「${messageId}」は大文字英字とアンダースコアの形式（例: MSG_001）を推奨します`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
            cellKey: "messageId",
          }
        )
      );
    }
  });

  return issues;
}

/**
 * Check if the table is a messages table
 */
export function isMessagesTable(fieldKey: string): boolean {
  return (
    fieldKey === "messages" ||
    fieldKey === "errorMessages" ||
    fieldKey === "notifications" ||
    fieldKey === "alerts"
  );
}
