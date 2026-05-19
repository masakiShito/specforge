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
 */
export function validateRequestParams(
  context: TableValidationContext
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  // Check for duplicate parameter names
  issues.push(...validateDuplicateKeys(context, "name", "パラメータ名"));

  // Check for empty rows
  issues.push(
    ...validateEmptyRows(context, ["name", "type"], "リクエストパラメータ")
  );

  // Check required fields
  issues.push(
    ...validateRequiredTableFields(context, [
      { key: "name", label: "パラメータ名" },
      { key: "type", label: "データ型" },
    ])
  );

  // Validate parameter-specific rules
  context.rows.forEach((row, rowIndex) => {
    // Skip empty rows
    if (isCellEmpty(row.name) && isCellEmpty(row.type)) return;

    // Validate data type
    const dataType = getDisplayValue(row.type).toLowerCase();
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
            cellKey: "type",
          }
        )
      );
    }

    // Check for required flag without validation
    const isRequired = row.required === true || row.required === "true";
    if (isRequired && isCellEmpty(row.validation) && isCellEmpty(row.constraints)) {
      issues.push(
        createIssue(
          `required-param-no-validation-${rowIndex}`,
          "info",
          `行${rowIndex + 1}は必須パラメータですが、バリデーションルールが設定されていません`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
          }
        )
      );
    }

    // Check parameter name format (snake_case or camelCase recommended)
    const paramName = getDisplayValue(row.name);
    if (paramName && !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(paramName)) {
      issues.push(
        createIssue(
          `invalid-param-name-${rowIndex}`,
          "warning",
          `行${rowIndex + 1}のパラメータ名「${paramName}」は英数字とアンダースコアのみを推奨します`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
            cellKey: "name",
          }
        )
      );
    }

    // Check for description
    if (isCellEmpty(row.description)) {
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
 */
export function validateResponseSchema(
  context: TableValidationContext
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  // Check for duplicate field names
  issues.push(...validateDuplicateKeys(context, "name", "フィールド名"));
  issues.push(...validateDuplicateKeys(context, "field", "フィールド名"));

  // Check for empty rows
  issues.push(
    ...validateEmptyRows(context, ["name", "type"], "レスポンスフィールド")
  );

  // Validate field-specific rules
  context.rows.forEach((row, rowIndex) => {
    const fieldName = getDisplayValue(row.name) || getDisplayValue(row.field);
    const dataType = getDisplayValue(row.type).toLowerCase();

    // Skip empty rows
    if (!fieldName && !dataType) return;

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
            cellKey: "type",
          }
        )
      );
    }

    // Check for example value
    if (isCellEmpty(row.example) && isCellEmpty(row.sampleValue)) {
      issues.push(
        createIssue(
          `missing-example-${rowIndex}`,
          "info",
          `行${rowIndex + 1}のフィールドに例示値がありません`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
            cellKey: "example",
          }
        )
      );
    }

    // Check for nested object without schema reference
    if (dataType === "object" || dataType === "array") {
      if (isCellEmpty(row.schema) && isCellEmpty(row.items) && isCellEmpty(row.ref)) {
        issues.push(
          createIssue(
            `complex-type-no-schema-${rowIndex}`,
            "warning",
            `行${rowIndex + 1}の${dataType}型にスキーマ参照または詳細定義がありません`,
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
  });

  return issues;
}

/**
 * Validate error responses table
 */
export function validateErrorResponses(
  context: TableValidationContext
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  // Check for duplicate status codes
  issues.push(...validateDuplicateKeys(context, "statusCode", "ステータスコード"));
  issues.push(...validateDuplicateKeys(context, "code", "ステータスコード"));

  // Check for empty rows
  issues.push(
    ...validateEmptyRows(context, ["statusCode", "description"], "エラーレスポンス")
  );

  // Validate error-specific rules
  context.rows.forEach((row, rowIndex) => {
    const statusCode = getDisplayValue(row.statusCode) || getDisplayValue(row.code);

    // Skip empty rows
    if (!statusCode) return;

    // Check for description
    if (isCellEmpty(row.description) && isCellEmpty(row.message)) {
      issues.push(
        createIssue(
          `missing-error-description-${rowIndex}`,
          "warning",
          `行${rowIndex + 1}のエラーレスポンスに説明がありません`,
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

    // Check for error schema
    if (isCellEmpty(row.schema) && isCellEmpty(row.body)) {
      issues.push(
        createIssue(
          `missing-error-schema-${rowIndex}`,
          "info",
          `行${rowIndex + 1}のエラーレスポンスにレスポンスボディの定義がありません`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
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
    fieldKey === "responseSchema" ||
    fieldKey === "responseFields" ||
    fieldKey === "responseBody"
  );
}

/**
 * Check if the table is an error responses table
 */
export function isErrorResponsesTable(fieldKey: string): boolean {
  return (
    fieldKey === "errorResponses" ||
    fieldKey === "errors" ||
    fieldKey === "errorCodes"
  );
}
