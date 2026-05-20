import { describe, it, expect } from "vitest";
import { validateScreenFields, isScreenFieldsTable } from "./screen-fields";
import type { TableValidationContext, TableRowValue } from "../types";

describe("validateScreenFields", () => {
  const createContext = (
    rows: Record<string, TableRowValue>[]
  ): TableValidationContext => ({
    documentId: "doc-1",
    sectionKey: "screen-fields",
    fieldKey: "screen-fields",
    rows,
    columns: [
      { key: "name", label: "項目名" },
      { key: "fieldKey", label: "項目キー" },
      { key: "inputType", label: "入力形式" },
      { key: "required", label: "必須" },
      { key: "validationRule", label: "入力制御" },
    ],
  });

  it("should return no issues for valid fields", () => {
    const context = createContext([
      { name: "ユーザー名", fieldKey: "userName", inputType: "text", required: true },
      { name: "メールアドレス", fieldKey: "email", inputType: "text", required: true },
    ]);

    const issues = validateScreenFields(context);
    const errors = issues.filter((i) => i.severity === "error");
    expect(errors).toHaveLength(0);
  });

  it("should detect duplicate field keys", () => {
    const context = createContext([
      { name: "ユーザー名", fieldKey: "userName", inputType: "text" },
      { name: "ユーザー名2", fieldKey: "userName", inputType: "text" },
    ]);

    const issues = validateScreenFields(context);
    const duplicateIssue = issues.find((i) => i.id.includes("duplicate"));
    expect(duplicateIssue).toBeDefined();
    expect(duplicateIssue?.severity).toBe("error");
  });

  it("should detect missing required fields", () => {
    const context = createContext([
      { name: "", fieldKey: "userName", inputType: "text" }, // missing name
      { name: "Email", fieldKey: "", inputType: "text" }, // missing fieldKey
    ]);

    const issues = validateScreenFields(context);
    const requiredIssues = issues.filter((i) => i.id.includes("required"));
    expect(requiredIssues.length).toBeGreaterThan(0);
  });

  it("should warn about invalid field key format", () => {
    const context = createContext([
      { name: "Invalid ID", fieldKey: "123invalid", inputType: "text" },
      { name: "Spaces", fieldKey: "has spaces", inputType: "text" },
    ]);

    const issues = validateScreenFields(context);
    const formatIssues = issues.filter((i) => i.id.includes("invalid-field-key-format"));
    expect(formatIssues.length).toBeGreaterThan(0);
    expect(formatIssues[0]?.severity).toBe("warning");
  });

  it("should suggest validation rule for required fields", () => {
    const context = createContext([
      { name: "ユーザー名", fieldKey: "userName", inputType: "text", required: true }, // no validationRule
    ]);

    const issues = validateScreenFields(context);
    const validationIssue = issues.find((i) => i.id.includes("required-without-validation"));
    expect(validationIssue).toBeDefined();
    expect(validationIssue?.severity).toBe("info");
  });

  it("should require options for select/radio types when options column exists", () => {
    const context: TableValidationContext = {
      documentId: "doc-1",
      sectionKey: "screen-fields",
      fieldKey: "screen-fields",
      rows: [
        { name: "性別", fieldKey: "gender", inputType: "select", options: "" },
        { name: "同意", fieldKey: "agree", inputType: "checkbox", options: "" },
      ],
      columns: [
        { key: "name", label: "項目名" },
        { key: "fieldKey", label: "項目キー" },
        { key: "inputType", label: "入力形式" },
        { key: "options", label: "選択肢" },
      ],
    };

    const issues = validateScreenFields(context);
    const optionIssues = issues.filter((i) => i.id.includes("missing-options"));
    expect(optionIssues.length).toBe(2);
    expect(optionIssues[0]?.severity).toBe("error");
  });

  it("should skip empty rows", () => {
    const context = createContext([
      { name: "", fieldKey: "", inputType: "" },
      { name: "ユーザー名", fieldKey: "userName", inputType: "text" },
    ]);

    const issues = validateScreenFields(context);
    // Should have warning for empty row, but no required field errors for it
    const emptyRowIssues = issues.filter((i) => i.id.includes("empty-row"));
    expect(emptyRowIssues.length).toBe(1);
  });
});

describe("isScreenFieldsTable", () => {
  it("should return true for valid field keys", () => {
    expect(isScreenFieldsTable("fields")).toBe(true);
    expect(isScreenFieldsTable("screenFields")).toBe(true);
    expect(isScreenFieldsTable("inputFields")).toBe(true);
    expect(isScreenFieldsTable("formFields")).toBe(true);
  });

  it("should return false for invalid field keys", () => {
    expect(isScreenFieldsTable("events")).toBe(false);
    expect(isScreenFieldsTable("messages")).toBe(false);
    expect(isScreenFieldsTable("other")).toBe(false);
  });
});
