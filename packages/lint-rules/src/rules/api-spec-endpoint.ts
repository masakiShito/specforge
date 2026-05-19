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
 * Valid HTTP status codes
 */
const VALID_STATUS_CODES = [
  "200",
  "201",
  "204",
  "301",
  "302",
  "304",
  "400",
  "401",
  "403",
  "404",
  "405",
  "409",
  "422",
  "429",
  "500",
  "502",
  "503",
  "504",
];

/**
 * Validate API spec endpoints table
 */
export function validateApiSpecEndpoints(
  context: TableValidationContext
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  // Check for duplicate endpoint paths + methods
  const endpointMethodMap = new Map<string, number[]>();
  context.rows.forEach((row, index) => {
    const path = getDisplayValue(row.path);
    const method = getDisplayValue(row.method).toUpperCase();
    if (path && method) {
      const key = `${method} ${path}`;
      const existing = endpointMethodMap.get(key) || [];
      existing.push(index);
      endpointMethodMap.set(key, existing);
    }
  });

  endpointMethodMap.forEach((indices, key) => {
    if (indices.length > 1) {
      issues.push(
        createIssue(
          `duplicate-endpoint-${key.replace(/\s+/g, "-")}`,
          "error",
          `エンドポイント「${key}」が重複しています（行: ${indices.map((i) => i + 1).join(", ")}）`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex: indices[0],
          }
        )
      );
    }
  });

  // Check for empty rows
  issues.push(...validateEmptyRows(context, ["path", "method"], "エンドポイント"));

  // Check required fields
  issues.push(
    ...validateRequiredTableFields(context, [
      { key: "path", label: "パス" },
      { key: "method", label: "HTTPメソッド" },
      { key: "description", label: "説明" },
    ])
  );

  // Validate endpoint-specific rules
  context.rows.forEach((row, rowIndex) => {
    // Skip empty rows
    if (isCellEmpty(row.path) && isCellEmpty(row.method)) return;

    // Validate HTTP method
    const method = getDisplayValue(row.method).toUpperCase();
    if (method && !VALID_HTTP_METHODS.includes(method)) {
      issues.push(
        createIssue(
          `invalid-api-method-${rowIndex}`,
          "error",
          `行${rowIndex + 1}のHTTPメソッド「${method}」は無効です`,
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

    // Validate path format
    const path = getDisplayValue(row.path);
    if (path) {
      if (!path.startsWith("/")) {
        issues.push(
          createIssue(
            `invalid-path-format-${rowIndex}`,
            "error",
            `行${rowIndex + 1}のパス「${path}」は/で始まる必要があります`,
            {
              documentId: context.documentId,
              sectionKey: context.sectionKey,
              fieldKey: context.fieldKey,
              rowIndex,
              cellKey: "path",
            }
          )
        );
      }

      // Check for consistent path parameter format
      const colonParams = path.match(/:\w+/g) || [];
      const bracketParams = path.match(/{\w+}/g) || [];
      if (colonParams.length > 0 && bracketParams.length > 0) {
        issues.push(
          createIssue(
            `mixed-path-param-format-${rowIndex}`,
            "warning",
            `行${rowIndex + 1}のパスにパスパラメータの形式が混在しています（:id と {id}）`,
            {
              documentId: context.documentId,
              sectionKey: context.sectionKey,
              fieldKey: context.fieldKey,
              rowIndex,
              cellKey: "path",
            }
          )
        );
      }
    }

    // Check for response status codes
    const statusCode = getDisplayValue(row.statusCode);
    if (statusCode && !VALID_STATUS_CODES.includes(statusCode)) {
      issues.push(
        createIssue(
          `unusual-status-code-${rowIndex}`,
          "info",
          `行${rowIndex + 1}のステータスコード「${statusCode}」は一般的ではありません`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
            cellKey: "statusCode",
          }
        )
      );
    }

    // Check for authentication requirements
    if (isCellEmpty(row.auth) && isCellEmpty(row.authentication)) {
      issues.push(
        createIssue(
          `missing-auth-info-${rowIndex}`,
          "info",
          `行${rowIndex + 1}のエンドポイントに認証要件が設定されていません`,
          {
            documentId: context.documentId,
            sectionKey: context.sectionKey,
            fieldKey: context.fieldKey,
            rowIndex,
          }
        )
      );
    }

    // Check for request/response schema on POST/PUT/PATCH
    if (method === "POST" || method === "PUT" || method === "PATCH") {
      if (isCellEmpty(row.requestSchema) && isCellEmpty(row.requestBody)) {
        issues.push(
          createIssue(
            `missing-request-schema-${rowIndex}`,
            "warning",
            `行${rowIndex + 1}の${method}エンドポイントにリクエストスキーマが設定されていません`,
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

    // Check for response schema
    if (
      isCellEmpty(row.responseSchema) &&
      isCellEmpty(row.response) &&
      method !== "DELETE"
    ) {
      issues.push(
        createIssue(
          `missing-response-schema-${rowIndex}`,
          "info",
          `行${rowIndex + 1}のエンドポイントにレスポンススキーマが設定されていません`,
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
 * Check if the table is an API spec endpoints table
 */
export function isApiSpecEndpointsTable(fieldKey: string): boolean {
  return (
    fieldKey === "endpoints" ||
    fieldKey === "routes" ||
    fieldKey === "apiEndpoints"
  );
}
