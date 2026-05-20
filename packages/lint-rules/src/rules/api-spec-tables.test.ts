import { describe, it, expect } from "vitest";
import {
  validateRequestParams,
  validateResponseSchema,
  validateErrorResponses,
  isRequestParamsTable,
  isResponseSchemaTable,
  isErrorResponsesTable,
} from "./api-spec-tables";
import type { TableValidationContext, TableRowValue } from "../types";

describe("validateRequestParams", () => {
  const createContext = (
    rows: Record<string, TableRowValue>[]
  ): TableValidationContext => ({
    documentId: "doc-1",
    sectionKey: "request-parameters",
    fieldKey: "request-parameters",
    rows,
    columns: [
      { key: "parameterName", label: "項目名" },
      { key: "parameterKey", label: "パラメータキー" },
      { key: "dataType", label: "型" },
      { key: "required", label: "必須" },
      { key: "description", label: "説明" },
      { key: "note", label: "備考" },
    ],
  });

  it("should return no issues for valid parameters", () => {
    const context = createContext([
      { parameterName: "ユーザーID", parameterKey: "user_id", dataType: "string", required: true, description: "ユーザーを識別するID" },
      { parameterName: "ページ番号", parameterKey: "page", dataType: "integer", required: false, description: "表示するページ番号" },
    ]);

    const issues = validateRequestParams(context);
    const errors = issues.filter((i) => i.severity === "error");
    expect(errors).toHaveLength(0);
  });

  it("should detect duplicate parameter keys", () => {
    const context = createContext([
      { parameterName: "ユーザーID", parameterKey: "user_id", dataType: "string", description: "ユーザーID" },
      { parameterName: "ユーザーID2", parameterKey: "user_id", dataType: "integer", description: "ユーザーID2" },
    ]);

    const issues = validateRequestParams(context);
    const duplicateIssue = issues.find((i) => i.id.includes("duplicate"));
    expect(duplicateIssue).toBeDefined();
    expect(duplicateIssue?.severity).toBe("error");
  });

  it("should inform about unusual data types", () => {
    const context = createContext([
      { parameterName: "カスタム項目", parameterKey: "custom_field", dataType: "customType", description: "カスタムフィールド" },
    ]);

    const issues = validateRequestParams(context);
    const typeIssue = issues.find((i) => i.id.includes("unusual-data-type"));
    expect(typeIssue).toBeDefined();
    expect(typeIssue?.severity).toBe("info");
  });

  it("should accept standard data types", () => {
    const context = createContext([
      { parameterName: "名前", parameterKey: "name", dataType: "string", description: "名前" },
      { parameterName: "年齢", parameterKey: "age", dataType: "integer", description: "年齢" },
      { parameterName: "有効", parameterKey: "active", dataType: "boolean", description: "有効" },
      { parameterName: "タグ", parameterKey: "tags", dataType: "array", description: "タグ" },
    ]);

    const issues = validateRequestParams(context);
    const typeIssues = issues.filter((i) => i.id.includes("unusual-data-type"));
    expect(typeIssues).toHaveLength(0);
  });

  it("should warn about invalid parameter key format", () => {
    const context = createContext([
      { parameterName: "無効", parameterKey: "123invalid", dataType: "string", description: "無効な名前" },
      { parameterName: "スペース", parameterKey: "has space", dataType: "string", description: "スペース" },
    ]);

    const issues = validateRequestParams(context);
    const formatIssues = issues.filter((i) => i.id.includes("invalid-param-key"));
    expect(formatIssues.length).toBeGreaterThan(0);
    expect(formatIssues[0]?.severity).toBe("warning");
  });

  it("should suggest description for parameters", () => {
    const context = createContext([
      { parameterName: "ユーザーID", parameterKey: "user_id", dataType: "string" },
    ]);

    const issues = validateRequestParams(context);
    const descIssue = issues.find((i) => i.id.includes("missing-param-description"));
    expect(descIssue).toBeDefined();
    expect(descIssue?.severity).toBe("info");
  });

  it("should skip empty rows", () => {
    const context = createContext([
      { parameterName: "", parameterKey: "" },
      { parameterName: "ユーザーID", parameterKey: "user_id", dataType: "string", description: "ユーザーID" },
    ]);

    const issues = validateRequestParams(context);
    const emptyRowIssues = issues.filter((i) => i.id.includes("empty-row"));
    expect(emptyRowIssues.length).toBe(1);
  });
});

describe("validateResponseSchema", () => {
  const createContext = (
    rows: Record<string, TableRowValue>[]
  ): TableValidationContext => ({
    documentId: "doc-1",
    sectionKey: "response-parameters",
    fieldKey: "response-parameters",
    rows,
    columns: [
      { key: "parameterName", label: "項目名" },
      { key: "parameterKey", label: "パラメータキー" },
      { key: "dataType", label: "型" },
      { key: "description", label: "説明" },
      { key: "note", label: "備考" },
    ],
  });

  it("should return no issues for valid response fields", () => {
    const context = createContext([
      { parameterName: "ID", parameterKey: "id", dataType: "string", description: "一意識別子" },
      { parameterName: "名前", parameterKey: "name", dataType: "string", description: "ユーザー名" },
    ]);

    const issues = validateResponseSchema(context);
    const errors = issues.filter((i) => i.severity === "error");
    expect(errors).toHaveLength(0);
  });

  it("should detect duplicate parameter keys", () => {
    const context = createContext([
      { parameterName: "ID", parameterKey: "id", dataType: "string", description: "識別子1" },
      { parameterName: "ID2", parameterKey: "id", dataType: "integer", description: "識別子2" },
    ]);

    const issues = validateResponseSchema(context);
    const duplicateIssue = issues.find((i) => i.id.includes("duplicate"));
    expect(duplicateIssue).toBeDefined();
  });

  it("should suggest description for response parameters", () => {
    const context = createContext([
      { parameterName: "ID", parameterKey: "id", dataType: "string" },
    ]);

    const issues = validateResponseSchema(context);
    const descIssue = issues.find((i) => i.id.includes("missing-response-description"));
    expect(descIssue).toBeDefined();
    expect(descIssue?.severity).toBe("info");
  });

  it("should warn about invalid parameter key format", () => {
    const context = createContext([
      { parameterName: "無効", parameterKey: "123invalid", dataType: "string", description: "説明" },
    ]);

    const issues = validateResponseSchema(context);
    const formatIssues = issues.filter((i) => i.id.includes("invalid-response-param-key"));
    expect(formatIssues.length).toBeGreaterThan(0);
    expect(formatIssues[0]?.severity).toBe("warning");
  });
});

describe("validateErrorResponses", () => {
  const createContext = (
    rows: Record<string, TableRowValue>[]
  ): TableValidationContext => ({
    documentId: "doc-1",
    sectionKey: "error-responses",
    fieldKey: "error-responses",
    rows,
    columns: [
      { key: "errorCode", label: "エラーコード" },
      { key: "errorName", label: "エラー名" },
      { key: "condition", label: "発生条件" },
      { key: "message", label: "メッセージ" },
      { key: "note", label: "備考" },
    ],
  });

  it("should return no issues for valid error responses", () => {
    const context = createContext([
      { errorCode: "400", errorName: "BadRequest", condition: "リクエストが不正な場合", message: "不正なリクエストです" },
      { errorCode: "404", errorName: "NotFound", condition: "リソースが存在しない場合", message: "リソースが見つかりません" },
    ]);

    const issues = validateErrorResponses(context);
    const errors = issues.filter((i) => i.severity === "error");
    expect(errors).toHaveLength(0);
  });

  it("should detect duplicate error codes", () => {
    const context = createContext([
      { errorCode: "400", errorName: "BadRequest", condition: "条件1", message: "不正なリクエスト" },
      { errorCode: "400", errorName: "ValidationError", condition: "条件2", message: "バリデーションエラー" },
    ]);

    const issues = validateErrorResponses(context);
    const duplicateIssue = issues.find((i) => i.id.includes("duplicate"));
    expect(duplicateIssue).toBeDefined();
  });

  it("should detect missing required fields", () => {
    const context = createContext([
      { errorCode: "500", errorName: "", condition: "サーバーエラー", message: "内部エラー" },
    ]);

    const issues = validateErrorResponses(context);
    const requiredIssue = issues.find((i) => i.id.includes("required"));
    expect(requiredIssue).toBeDefined();
  });

  it("should warn about short condition", () => {
    const context = createContext([
      { errorCode: "400", errorName: "BadRequest", condition: "NG", message: "エラーです" },
    ]);

    const issues = validateErrorResponses(context);
    const conditionIssue = issues.find((i) => i.id.includes("short-error-condition"));
    expect(conditionIssue).toBeDefined();
    expect(conditionIssue?.severity).toBe("info");
  });
});

describe("table type detection", () => {
  describe("isRequestParamsTable", () => {
    it("should return true for valid field keys", () => {
      expect(isRequestParamsTable("request-parameters")).toBe(true);
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
      expect(isResponseSchemaTable("response-parameters")).toBe(true);
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
      expect(isErrorResponsesTable("error-responses")).toBe(true);
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
