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
 * Common data types for API schemas
 */
const COMMON_DATA_TYPES = [
  "string",
  "number",
  "integer",
  "boolean",
  "array",
  "object",
  "null",
  "date",
  "datetime",
  "timestamp",
  "uuid",
  "email",
  "url",
  "enum",
];

/**
 * Validate request parameters table
 *
 * Expected columns (from api-spec.ts):
 * - parameterName (項目名) - required
 * - parameterKey (パラメータキー) - required
 * - dataType (型) - required
 * - required (必須) - required
 * - description (説明) - required
 * - note (備考) - optional
 */
export function validateRequestParams(
  context: TableValidationContext
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  // Check for duplicate parameter keys
  issues.push(...validateDuplicateKeys(context, "parameterKey", "パラメータキー"));

  // Check for empty rows
  issues.push(
    ...validateEmptyRows(context, ["parameterName", "parameterKey"], "リクエストパラメータ")
  );

  // Check required fields
  issues.push(
    ...validateRequiredTableFields(context, [
      { key: "parameterName", label: "項目名" },
      { key: "parameterKey", label: "パラメータキー" },
      { key: "dataType", label: "型" },
    ])
  );

  // Validate parameter-specific rules
  context.rows.forEach((row, rowIndex) => {
    // Skip empty rows
    if (isCellEmpty(row["parameterName"]) && isCellEmpty(row["parameterKey"])) return;

    // Validate data type
    const dataType = getDisplayValue(row["dataType"]).toLowerCase();
    if (dataType && !COMMON_DATA_TYPES.includes(dataType)) {
      issues.push(
        createIssue(
          `unusual-data-type-param-${rowIndex}`,
          "info",
          `行${rowIndex + 1}のデータ型「${dataType}」は標準的な型ではありません`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
            cellKey: "dataType",
          }
        )
      );
    }

    // Check parameter key format (snake_case or camelCase recommended)
    const paramKey = getDisplayValue(row["parameterKey"]);
    if (paramKey && !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(paramKey)) {
      issues.push(
        createIssue(
          `invalid-param-key-${rowIndex}`,
          "warning",
          `行${rowIndex + 1}のパラメータキー「${paramKey}」は英数字とアンダースコアのみを推奨します`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
            cellKey: "parameterKey",
          }
        )
      );
    }

    // Check for description
    if (isCellEmpty(row["description"])) {
      issues.push(
        createIssue(
          `missing-param-description-${rowIndex}`,
          "info",
          `行${rowIndex + 1}のパラメータに説明がありません`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
            cellKey: "description",
          }
        )
      );
    }
  });

  return issues;
}

/**
 * Validate response schema table
 *
 * Expected columns (from api-spec.ts):
 * - parameterName (項目名) - required
 * - parameterKey (パラメータキー) - required
 * - dataType (型) - required
 * - description (説明) - required
 * - note (備考) - optional
 */
export function validateResponseSchema(
  context: TableValidationContext
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  // Check for duplicate parameter keys
  issues.push(...validateDuplicateKeys(context, "parameterKey", "パラメータキー"));

  // Check for empty rows
  issues.push(
    ...validateEmptyRows(context, ["parameterName", "parameterKey"], "レスポンスパラメータ")
  );

  // Check required fields
  issues.push(
    ...validateRequiredTableFields(context, [
      { key: "parameterName", label: "項目名" },
      { key: "parameterKey", label: "パラメータキー" },
      { key: "dataType", label: "型" },
    ])
  );

  // Validate field-specific rules
  context.rows.forEach((row, rowIndex) => {
    const paramName = getDisplayValue(row["parameterName"]);
    const paramKey = getDisplayValue(row["parameterKey"]);
    const dataType = getDisplayValue(row["dataType"]).toLowerCase();

    // Skip empty rows
    if (!paramName && !paramKey) return;

    // Validate data type
    if (dataType && !COMMON_DATA_TYPES.includes(dataType)) {
      issues.push(
        createIssue(
          `unusual-data-type-response-${rowIndex}`,
          "info",
          `行${rowIndex + 1}のデータ型「${dataType}」は標準的な型ではありません`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
            cellKey: "dataType",
          }
        )
      );
    }

    // Check parameter key format (snake_case or camelCase recommended)
    if (paramKey && !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(paramKey)) {
      issues.push(
        createIssue(
          `invalid-response-param-key-${rowIndex}`,
          "warning",
          `行${rowIndex + 1}のパラメータキー「${paramKey}」は英数字とアンダースコアのみを推奨します`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
            cellKey: "parameterKey",
          }
        )
      );
    }

    // Check for description
    if (isCellEmpty(row["description"])) {
      issues.push(
        createIssue(
          `missing-response-description-${rowIndex}`,
          "info",
          `行${rowIndex + 1}のパラメータに説明がありません`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
            cellKey: "description",
          }
        )
      );
    }
  });

  return issues;
}

/**
 * Validate error responses table
 *
 * Expected columns (from api-spec.ts):
 * - errorCode (エラーコード) - required
 * - errorName (エラー名) - required
 * - condition (発生条件) - required
 * - message (メッセージ) - required
 * - note (備考) - optional
 */
export function validateErrorResponses(
  context: TableValidationContext
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  // Check for duplicate error codes
  issues.push(...validateDuplicateKeys(context, "errorCode", "エラーコード"));

  // Check for empty rows
  issues.push(
    ...validateEmptyRows(context, ["errorCode", "errorName"], "エラーレスポンス")
  );

  // Check required fields
  issues.push(
    ...validateRequiredTableFields(context, [
      { key: "errorCode", label: "エラーコード" },
      { key: "errorName", label: "エラー名" },
      { key: "condition", label: "発生条件" },
      { key: "message", label: "メッセージ" },
    ])
  );

  // Validate error-specific rules
  context.rows.forEach((row, rowIndex) => {
    const errorCode = getDisplayValue(row["errorCode"]);
    const errorName = getDisplayValue(row["errorName"]);

    // Skip empty rows
    if (!errorCode && !errorName) return;

    // Check condition is descriptive enough
    const condition = getDisplayValue(row["condition"]);
    if (condition && condition.length < 5) {
      issues.push(
        createIssue(
          `short-error-condition-${rowIndex}`,
          "info",
          `行${rowIndex + 1}の発生条件が短すぎます。より詳細な説明を推奨します`,
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
  });

  return issues;
}

/**
 * Check if the table is a request params table
 */
export function isRequestParamsTable(fieldKey: string): boolean {
  return (
    fieldKey === "request-parameters" ||
    fieldKey === "requestParams" ||
    fieldKey === "parameters" ||
    fieldKey === "queryParams" ||
    fieldKey === "pathParams" ||
    fieldKey === "bodyParams"
  );
}

/**
 * Check if the table is a response schema table
 */
export function isResponseSchemaTable(fieldKey: string): boolean {
  return (
    fieldKey === "response-parameters" ||
    fieldKey === "responseSchema" ||
    fieldKey === "responseFields" ||
    fieldKey === "responseBody" ||
    fieldKey === "responseParams"
  );
}

/**
 * Check if the table is an error responses table
 */
export function isErrorResponsesTable(fieldKey: string): boolean {
  return (
    fieldKey === "error-responses" ||
    fieldKey === "errorResponses" ||
    fieldKey === "errors" ||
    fieldKey === "errorCodes"
  );
}
