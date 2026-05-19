import type {
  DesignValidationIssue,
  TableValidationContext,
} from "../types";
import { isReferenceValue } from "../types";
import {
  createIssue,
  validateDuplicateKeys,
  validateEmptyRows,
  validateRequiredTableFields,
  isCellEmpty,
  getDisplayValue,
} from "./common";

/**
 * Valid HTTP methods
 */
const VALID_HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
];

/**
 * Validate API connections table
 */
export function validateApiConnections(
  context: TableValidationContext
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  // Check for duplicate connection IDs
  issues.push(...validateDuplicateKeys(context, "id", "API連携ID"));

  // Check for empty rows
  issues.push(
    ...validateEmptyRows(context, ["id", "endpoint"], "API連携")
  );

  // Check required fields
  issues.push(
    ...validateRequiredTableFields(context, [
      { key: "id", label: "API連携ID" },
      { key: "endpoint", label: "エンドポイント" },
      { key: "method", label: "HTTPメソッド" },
    ])
  );

  // Validate API connection-specific rules
  context.rows.forEach((row, rowIndex) => {
    // Skip empty rows
    if (isCellEmpty(row.id) && isCellEmpty(row.endpoint)) return;

    // Validate HTTP method
    const method = getDisplayValue(row.method).toUpperCase();
    if (method && !VALID_HTTP_METHODS.includes(method)) {
      issues.push(
        createIssue(
          `invalid-http-method-${rowIndex}`,
          "error",
          `行${rowIndex + 1}のHTTPメソッド「${method}」は無効です。有効な値: ${VALID_HTTP_METHODS.join(", ")}`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
            cellKey: "method",
          }
        )
      );
    }

    // Check endpoint format
    const endpoint = getDisplayValue(row.endpoint);
    if (endpoint) {
      // Check for API spec reference
      if (isReferenceValue(row.endpoint)) {
        // Valid reference - no further validation needed
      } else if (!endpoint.startsWith("/") && !endpoint.startsWith("http")) {
        issues.push(
          createIssue(
            `invalid-endpoint-format-${rowIndex}`,
            "warning",
            `行${rowIndex + 1}のエンドポイント「${endpoint}」は/またはhttpで始まる形式を推奨します`,
            {
              documentId: context.documentId,
              sectionKey: context.sectionKey,
              fieldKey: context.fieldKey,
              rowIndex,
              cellKey: "endpoint",
            }
          )
        );
      }

      // Check for path parameters
      const pathParams = endpoint.match(/{\w+}|:\w+/g);
      if (pathParams && pathParams.length > 0) {
        // Check if request parameters are documented
        if (isCellEmpty(row.requestParams) && isCellEmpty(row.pathParams)) {
          issues.push(
            createIssue(
              `undocumented-path-params-${rowIndex}`,
              "warning",
              `行${rowIndex + 1}のエンドポイントにパスパラメータ（${pathParams.join(", ")}）がありますが、パラメータ定義がありません`,
              {
                documentId: context.documentId,
                sectionKey: context.sectionKey,
                fieldKey: context.fieldKey,
                rowIndex,
                cellKey: "endpoint",
              }
            )
          );
        }
      }
    }

    // Check for request body on GET/DELETE
    if ((method === "GET" || method === "DELETE") && !isCellEmpty(row.requestBody)) {
      issues.push(
        createIssue(
          `unexpected-request-body-${rowIndex}`,
          "warning",
          `行${rowIndex + 1}の${method}リクエストにリクエストボディが設定されています`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
            cellKey: "requestBody",
          }
        )
      );
    }

    // Check for missing request body on POST/PUT/PATCH
    if (
      (method === "POST" || method === "PUT" || method === "PATCH") &&
      isCellEmpty(row.requestBody) &&
      isCellEmpty(row.requestData)
    ) {
      issues.push(
        createIssue(
          `missing-request-body-${rowIndex}`,
          "info",
          `行${rowIndex + 1}の${method}リクエストにリクエストボディが設定されていません`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
          }
        )
      );
    }

    // Check for error handling
    if (isCellEmpty(row.errorHandling) && isCellEmpty(row.onError)) {
      issues.push(
        createIssue(
          `missing-error-handling-${rowIndex}`,
          "info",
          `行${rowIndex + 1}のAPI連携にエラーハンドリングが設定されていません`,
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
 * Check if the table is an API connections table
 */
export function isApiConnectionsTable(fieldKey: string): boolean {
  return (
    fieldKey === "apiConnections" ||
    fieldKey === "apiCalls" ||
    fieldKey === "apiIntegrations" ||
    fieldKey === "externalApis"
  );
}
