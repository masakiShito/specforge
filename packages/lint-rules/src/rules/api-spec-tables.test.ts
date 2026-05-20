import { describe, it, expect } from "vitest";
import {
  validateRequestParams,
  validateResponseSchema,
  validateErrorResponses,
  isRequestParamsTable,
  isResponseSchemaTable,
  isErrorResponsesTable,
} from "./api-spec-tables";
import type { TableValidationContext } from "../types";

describe("validateRequestParams", () => {
  const createContext = (
    rows: Record<string, unknown>[]
  ): TableValidationContext => ({
    documentId: "doc-1",
    sectionKey: "request",
    fieldKey: "requestParams",
    rows,
    columns: [
      { key: "name", label: "パラメータ名" },
      { key: "type", label: "データ型" },
      { key: "required", label: "必須" },
      { key: "description", label: "説明" },
    ],
  });

  it("should return no issues for valid parameters", () => {
    const context = createContext([
      { name: "user_id", type: "string", required: true, description: "ユーザーID" },
      { name: "page", type: "integer", required: false, description: "ページ番号" },
    ]);

    const issues = validateRequestParams(context);
    const errors = issues.filter((i) => i.severity === "error");
    expect(errors).toHaveLength(0);
  });

  it("should detect duplicate parameter names", () => {
    const context = createContext([
      { name: "user_id", type: "string", description: "ユーザーID" },
      { name: "user_id", type: "integer", description: "ユーザーID2" },
    ]);

    const issues = validateRequestParams(context);
    const duplicateIssue = issues.find((i) => i.id.includes("duplicate"));
    expect(duplicateIssue).toBeDefined();
    expect(duplicateIssue?.severity).toBe("error");
  });

  it("should inform about unusual data types", () => {
    const context = createContext([
      { name: "custom_field", type: "customType", description: "カスタムフィールド" },
    ]);

    const issues = validateRequestParams(context);
    const typeIssue = issues.find((i) => i.id.includes("unusual-data-type"));
    expect(typeIssue).toBeDefined();
    expect(typeIssue?.severity).toBe("info");
  });

  it("should accept standard data types", () => {
    const context = createContext([
      { name: "name", type: "string", description: "名前" },
      { name: "age", type: "integer", description: "年齢" },
      { name: "active", type: "boolean", description: "有効" },
      { name: "tags", type: "array", description: "タグ" },
    ]);

    const issues = validateRequestParams(context);
    const typeIssues = issues.filter((i) => i.id.includes("unusual-data-type"));
    expect(typeIssues).toHaveLength(0);
  });

  it("should warn about invalid parameter name format", () => {
    const context = createContext([
      { name: "123invalid", type: "string", description: "無効な名前" },
      { name: "has space", type: "string", description: "スペース" },
    ]);

    const issues = validateRequestParams(context);
    const formatIssues = issues.filter((i) => i.id.includes("invalid-param-name"));
    expect(formatIssues.length).toBeGreaterThan(0);
    expect(formatIssues[0]?.severity).toBe("warning");
  });

  it("should suggest description for parameters", () => {
    const context = createContext([
      { name: "user_id", type: "string" },
    ]);

    const issues = validateRequestParams(context);
    const descIssue = issues.find((i) => i.id.includes("missing-param-description"));
    expect(descIssue).toBeDefined();
    expect(descIssue?.severity).toBe("info");
  });

  it("should skip empty rows", () => {
    const context = createContext([
      { name: "", type: "" },
      { name: "user_id", type: "string", description: "ユーザーID" },
    ]);

    const issues = validateRequestParams(context);
    const emptyRowIssues = issues.filter((i) => i.id.includes("empty-row"));
    expect(emptyRowIssues.length).toBe(1);
  });
});

describe("validateResponseSchema", () => {
  const createContext = (
    rows: Record<string, unknown>[]
  ): TableValidationContext => ({
    documentId: "doc-1",
    sectionKey: "response",
    fieldKey: "responseSchema",
    rows,
    columns: [
      { key: "name", label: "フィールド名" },
      { key: "type", label: "データ型" },
      { key: "example", label: "例" },
    ],
  });

  it("should return no issues for valid response fields", () => {
    const context = createContext([
      { name: "id", type: "string", example: "abc-123" },
      { name: "name", type: "string", example: "田中太郎" },
    ]);

    const issues = validateResponseSchema(context);
    const errors = issues.filter((i) => i.severity === "error");
    expect(errors).toHaveLength(0);
  });

  it("should detect duplicate field names", () => {
    const context = createContext([
      { name: "id", type: "string", example: "abc" },
      { name: "id", type: "integer", example: "123" },
    ]);

    const issues = validateResponseSchema(context);
    const duplicateIssue = issues.find((i) => i.id.includes("duplicate"));
    expect(duplicateIssue).toBeDefined();
  });

  it("should suggest example values", () => {
    const context = createContext([
      { name: "id", type: "string" },
    ]);

    const issues = validateResponseSchema(context);
    const exampleIssue = issues.find((i) => i.id.includes("missing-example"));
    expect(exampleIssue).toBeDefined();
    expect(exampleIssue?.severity).toBe("info");
  });

  it("should warn about complex types without schema", () => {
    const context = createContext([
      { name: "items", type: "array" },
      { name: "metadata", type: "object" },
    ]);

    const issues = validateResponseSchema(context);
    const schemaIssues = issues.filter((i) => i.id.includes("complex-type-no-schema"));
    expect(schemaIssues.length).toBe(2);
    expect(schemaIssues[0]?.severity).toBe("warning");
  });

  it("should not warn when schema is defined", () => {
    const context = createContext([
      { name: "items", type: "array", schema: "Item[]" },
      { name: "metadata", type: "object", ref: "#/components/schemas/Metadata" },
    ]);

    const issues = validateResponseSchema(context);
    const schemaIssues = issues.filter((i) => i.id.includes("complex-type-no-schema"));
    expect(schemaIssues).toHaveLength(0);
  });
});

describe("validateErrorResponses", () => {
  const createContext = (
    rows: Record<string, unknown>[]
  ): TableValidationContext => ({
    documentId: "doc-1",
    sectionKey: "errors",
    fieldKey: "errorResponses",
    rows,
    columns: [
      { key: "statusCode", label: "ステータスコード" },
      { key: "description", label: "説明" },
      { key: "schema", label: "スキーマ" },
    ],
  });

  it("should return no issues for valid error responses", () => {
    const context = createContext([
      { statusCode: "400", description: "不正なリクエスト", schema: "ErrorResponse" },
      { statusCode: "404", description: "リソースが見つかりません", schema: "ErrorResponse" },
    ]);

    const issues = validateErrorResponses(context);
    const errors = issues.filter((i) => i.severity === "error");
    expect(errors).toHaveLength(0);
  });

  it("should detect duplicate status codes", () => {
    const context = createContext([
      { statusCode: "400", description: "不正なリクエスト" },
      { statusCode: "400", description: "バリデーションエラー" },
    ]);

    const issues = validateErrorResponses(context);
    const duplicateIssue = issues.find((i) => i.id.includes("duplicate"));
    expect(duplicateIssue).toBeDefined();
  });

  it("should warn about missing description", () => {
    const context = createContext([
      { statusCode: "500" },
    ]);

    const issues = validateErrorResponses(context);
    const descIssue = issues.find((i) => i.id.includes("missing-error-description"));
    expect(descIssue).toBeDefined();
    expect(descIssue?.severity).toBe("warning");
  });

  it("should suggest error schema", () => {
    const context = createContext([
      { statusCode: "400", description: "不正なリクエスト" },
    ]);

    const issues = validateErrorResponses(context);
    const schemaIssue = issues.find((i) => i.id.includes("missing-error-schema"));
    expect(schemaIssue).toBeDefined();
    expect(schemaIssue?.severity).toBe("info");
  });
});

describe("table type detection", () => {
  describe("isRequestParamsTable", () => {
    it("should return true for valid field keys", () => {
      expect(isRequestParamsTable("requestParams")).toBe(true);
      expect(isRequestParamsTable("parameters")).toBe(true);
      expect(isRequestParamsTable("queryParams")).toBe(true);
    });

    it("should return false for invalid field keys", () => {
      expect(isRequestParamsTable("responseSchema")).toBe(false);
      expect(isRequestParamsTable("errorResponses")).toBe(false);
    });
  });

  describe("isResponseSchemaTable", () => {
    it("should return true for valid field keys", () => {
      expect(isResponseSchemaTable("responseSchema")).toBe(true);
      expect(isResponseSchemaTable("responseFields")).toBe(true);
      expect(isResponseSchemaTable("responseBody")).toBe(true);
    });

    it("should return false for invalid field keys", () => {
      expect(isResponseSchemaTable("requestParams")).toBe(false);
      expect(isResponseSchemaTable("errorResponses")).toBe(false);
    });
  });

  describe("isErrorResponsesTable", () => {
    it("should return true for valid field keys", () => {
      expect(isErrorResponsesTable("errorResponses")).toBe(true);
      expect(isErrorResponsesTable("errors")).toBe(true);
      expect(isErrorResponsesTable("errorCodes")).toBe(true);
    });

    it("should return false for invalid field keys", () => {
      expect(isErrorResponsesTable("requestParams")).toBe(false);
      expect(isErrorResponsesTable("responseSchema")).toBe(false);
    });
  });
});
