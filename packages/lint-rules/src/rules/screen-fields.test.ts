import { describe, it, expect } from "vitest";
import { validateScreenFields, isScreenFieldsTable } from "./screen-fields";
import type { TableValidationContext } from "../types";

describe("validateScreenFields", () => {
  const createContext = (
    rows: Record<string, unknown>[]
  ): TableValidationContext => ({
    documentId: "doc-1",
    sectionKey: "screen-items",
    fieldKey: "fields",
    rows,
    columns: [
      { key: "id", label: "項目ID" },
      { key: "label", label: "ラベル" },
      { key: "type", label: "入力形式" },
    ],
  });

  it("should return no issues for valid fields", () => {
    const context = createContext([
      { id: "userName", label: "ユーザー名", type: "text", maxLength: 50 },
      { id: "email", label: "メールアドレス", type: "text", maxLength: 255 },
    ]);

    const issues = validateScreenFields(context);
    const errors = issues.filter((i) => i.severity === "error");
    expect(errors).toHaveLength(0);
  });

  it("should detect duplicate field IDs", () => {
    const context = createContext([
      { id: "userName", label: "ユーザー名", type: "text" },
      { id: "userName", label: "ユーザー名2", type: "text" },
    ]);

    const issues = validateScreenFields(context);
    const duplicateIssue = issues.find((i) => i.id.includes("duplicate"));
    expect(duplicateIssue).toBeDefined();
    expect(duplicateIssue?.severity).toBe("error");
  });

  it("should detect missing required fields", () => {
    const context = createContext([
      { id: "userName", label: "", type: "text" }, // missing label
      { id: "", label: "Email", type: "text" }, // missing id
    ]);

    const issues = validateScreenFields(context);
    const requiredIssues = issues.filter((i) => i.id.includes("required"));
    expect(requiredIssues.length).toBeGreaterThan(0);
  });

  it("should warn about invalid field ID format", () => {
    const context = createContext([
      { id: "123invalid", label: "Invalid ID", type: "text" },
      { id: "has spaces", label: "Spaces", type: "text" },
    ]);

    const issues = validateScreenFields(context);
    const formatIssues = issues.filter((i) => i.id.includes("invalid-field-id-format"));
    expect(formatIssues.length).toBeGreaterThan(0);
    expect(formatIssues[0]?.severity).toBe("warning");
  });

  it("should suggest maxLength for text inputs", () => {
    const context = createContext([
      { id: "userName", label: "ユーザー名", type: "text" }, // no maxLength
    ]);

    const issues = validateScreenFields(context);
    const maxLengthIssue = issues.find((i) => i.id.includes("missing-max-length"));
    expect(maxLengthIssue).toBeDefined();
    expect(maxLengthIssue?.severity).toBe("info");
  });

  it("should require options for select/radio types", () => {
    const context = createContext([
      { id: "gender", label: "性別", type: "select" }, // no options
      { id: "agree", label: "同意", type: "checkbox" }, // no options
    ]);

    const issues = validateScreenFields(context);
    const optionIssues = issues.filter((i) => i.id.includes("missing-options"));
    expect(optionIssues.length).toBe(2);
    expect(optionIssues[0]?.severity).toBe("error");
  });

  it("should skip empty rows", () => {
    const context = createContext([
      { id: "", label: "", type: "" },
      { id: "userName", label: "ユーザー名", type: "text", maxLength: 50 },
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
