import { describe, it, expect } from "vitest";
import { validateMessages, isMessagesTable } from "./messages";
import type { TableValidationContext } from "../types";

describe("validateMessages", () => {
  const createContext = (
    rows: Record<string, unknown>[]
  ): TableValidationContext => ({
    documentId: "doc-1",
    sectionKey: "messages",
    fieldKey: "messages",
    rows,
    columns: [
      { key: "id", label: "メッセージID" },
      { key: "type", label: "タイプ" },
      { key: "message", label: "メッセージ内容" },
      { key: "condition", label: "発生条件" },
    ],
  });

  it("should return no issues for valid messages", () => {
    const context = createContext([
      { id: "MSG_001", type: "success", message: "処理が完了しました" },
      { id: "MSG_002", type: "error", message: "エラーが発生しました", condition: "入力値が不正" },
    ]);

    const issues = validateMessages(context);
    const errors = issues.filter((i) => i.severity === "error");
    expect(errors).toHaveLength(0);
  });

  it("should detect duplicate message IDs", () => {
    const context = createContext([
      { id: "MSG_001", type: "success", message: "成功しました" },
      { id: "MSG_001", type: "error", message: "失敗しました" },
    ]);

    const issues = validateMessages(context);
    const duplicateIssue = issues.find((i) => i.id.includes("duplicate"));
    expect(duplicateIssue).toBeDefined();
    expect(duplicateIssue?.severity).toBe("error");
  });

  it("should detect missing required fields", () => {
    const context = createContext([
      { id: "MSG_001", type: "success", message: "" },
      { id: "", type: "error", message: "エラー" },
    ]);

    const issues = validateMessages(context);
    const requiredIssues = issues.filter((i) => i.id.includes("required"));
    expect(requiredIssues.length).toBeGreaterThan(0);
  });

  it("should inform about non-standard message types", () => {
    const context = createContext([
      { id: "MSG_001", type: "customType", message: "カスタムメッセージ" },
    ]);

    const issues = validateMessages(context);
    const typeIssue = issues.find((i) => i.id.includes("invalid-message-type"));
    expect(typeIssue).toBeDefined();
    expect(typeIssue?.severity).toBe("info");
  });

  it("should accept standard message types", () => {
    const context = createContext([
      { id: "MSG_001", type: "success", message: "成功メッセージ" },
      { id: "MSG_002", type: "error", message: "エラーメッセージ" },
      { id: "MSG_003", type: "warning", message: "警告メッセージ" },
      { id: "MSG_004", type: "info", message: "情報メッセージ" },
    ]);

    const issues = validateMessages(context);
    const typeIssues = issues.filter((i) => i.id.includes("invalid-message-type"));
    expect(typeIssues).toHaveLength(0);
  });

  it("should suggest message type when missing", () => {
    const context = createContext([
      { id: "MSG_001", message: "メッセージ内容" },
    ]);

    const issues = validateMessages(context);
    const missingTypeIssue = issues.find((i) => i.id.includes("missing-message-type"));
    expect(missingTypeIssue).toBeDefined();
    expect(missingTypeIssue?.severity).toBe("info");
  });

  it("should warn about short messages", () => {
    const context = createContext([
      { id: "MSG_001", type: "info", message: "OK" },
    ]);

    const issues = validateMessages(context);
    const shortIssue = issues.find((i) => i.id.includes("short-message"));
    expect(shortIssue).toBeDefined();
    expect(shortIssue?.severity).toBe("info");
  });

  it("should warn about undocumented placeholders", () => {
    const context = createContext([
      { id: "MSG_001", type: "info", message: "{{userName}}様、こんにちは" },
    ]);

    const issues = validateMessages(context);
    const placeholderIssue = issues.find((i) => i.id.includes("undocumented-placeholders"));
    expect(placeholderIssue).toBeDefined();
    expect(placeholderIssue?.severity).toBe("warning");
  });

  it("should not warn about documented placeholders", () => {
    const context = createContext([
      { id: "MSG_001", type: "info", message: "{{userName}}様、こんにちは", params: "userName: string" },
    ]);

    const issues = validateMessages(context);
    const placeholderIssue = issues.find((i) => i.id.includes("undocumented-placeholders"));
    expect(placeholderIssue).toBeUndefined();
  });

  it("should suggest condition for error messages", () => {
    const context = createContext([
      { id: "MSG_001", type: "error", message: "エラーが発生しました" },
    ]);

    const issues = validateMessages(context);
    const conditionIssue = issues.find((i) => i.id.includes("error-without-condition"));
    expect(conditionIssue).toBeDefined();
    expect(conditionIssue?.severity).toBe("info");
  });

  it("should suggest uppercase format for message IDs", () => {
    const context = createContext([
      { id: "msg001", type: "info", message: "メッセージ" },
      { id: "message-1", type: "info", message: "メッセージ" },
    ]);

    const issues = validateMessages(context);
    const formatIssues = issues.filter((i) => i.id.includes("invalid-message-id-format"));
    expect(formatIssues.length).toBe(2);
    expect(formatIssues[0]?.severity).toBe("info");
  });

  it("should skip empty rows", () => {
    const context = createContext([
      { id: "", type: "", message: "" },
      { id: "MSG_001", type: "info", message: "メッセージ" },
    ]);

    const issues = validateMessages(context);
    const emptyRowIssues = issues.filter((i) => i.id.includes("empty-row"));
    expect(emptyRowIssues.length).toBe(1);
  });
});

describe("isMessagesTable", () => {
  it("should return true for valid field keys", () => {
    expect(isMessagesTable("messages")).toBe(true);
    expect(isMessagesTable("errorMessages")).toBe(true);
    expect(isMessagesTable("notifications")).toBe(true);
    expect(isMessagesTable("alerts")).toBe(true);
  });

  it("should return false for invalid field keys", () => {
    expect(isMessagesTable("fields")).toBe(false);
    expect(isMessagesTable("events")).toBe(false);
    expect(isMessagesTable("other")).toBe(false);
  });
});
