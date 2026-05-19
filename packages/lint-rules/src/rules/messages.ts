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
 * Valid message types
 */
const VALID_MESSAGE_TYPES = [
  "success",
  "error",
  "warning",
  "info",
  "confirm",
  "notification",
  "toast",
  "modal",
  "alert",
  "validation",
];

/**
 * Validate messages table
 */
export function validateMessages(
  context: TableValidationContext
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  // Check for duplicate message IDs
  issues.push(...validateDuplicateKeys(context, "id", "メッセージID"));

  // Check for empty rows
  issues.push(...validateEmptyRows(context, ["id", "message"], "メッセージ"));

  // Check required fields
  issues.push(
    ...validateRequiredTableFields(context, [
      { key: "id", label: "メッセージID" },
      { key: "message", label: "メッセージ内容" },
    ])
  );

  // Validate message-specific rules
  context.rows.forEach((row, rowIndex) => {
    // Skip empty rows
    if (isCellEmpty(row.id) && isCellEmpty(row.message)) return;

    // Validate message type
    const messageType = getDisplayValue(row.type).toLowerCase();
    if (messageType && !VALID_MESSAGE_TYPES.includes(messageType)) {
      issues.push(
        createIssue(
          `invalid-message-type-${rowIndex}`,
          "info",
          `行${rowIndex + 1}のメッセージタイプ「${messageType}」は標準的なタイプではありません`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
            cellKey: "type",
          }
        )
      );
    }

    // Check if message type is set
    if (isCellEmpty(row.type)) {
      issues.push(
        createIssue(
          `missing-message-type-${rowIndex}`,
          "info",
          `行${rowIndex + 1}のメッセージタイプが未設定です`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
            cellKey: "type",
          }
        )
      );
    }

    // Check message content for potential issues
    const message = getDisplayValue(row.message);

    // Check for very short messages
    if (message && message.length < 5) {
      issues.push(
        createIssue(
          `short-message-${rowIndex}`,
          "info",
          `行${rowIndex + 1}のメッセージが短すぎる可能性があります`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
            cellKey: "message",
          }
        )
      );
    }

    // Check for placeholder patterns that might not have been replaced
    if (message && /{{\s*\w+\s*}}/.test(message)) {
      // Has placeholders - check if they're documented
      if (isCellEmpty(row.params) && isCellEmpty(row.variables)) {
        issues.push(
          createIssue(
            `undocumented-placeholders-${rowIndex}`,
            "warning",
            `行${rowIndex + 1}のメッセージにプレースホルダーがありますが、パラメータが未定義です`,
            {
              documentId: context.documentId,
              sectionKey: context.sectionKey,
              fieldKey: context.fieldKey,
              rowIndex,
              cellKey: "message",
            }
          )
        );
      }
    }

    // Check for error type without trigger condition
    if (messageType === "error" || messageType === "validation") {
      if (isCellEmpty(row.condition) && isCellEmpty(row.trigger)) {
        issues.push(
          createIssue(
            `error-without-condition-${rowIndex}`,
            "info",
            `行${rowIndex + 1}のエラーメッセージに発生条件が設定されていません`,
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

    // Validate message ID format
    const messageId = getDisplayValue(row.id);
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
            cellKey: "id",
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
