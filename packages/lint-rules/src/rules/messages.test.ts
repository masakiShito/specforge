import { describe, it, expect } from "vitest";
import { validateMessages, isMessagesTable } from "./messages";
import type { TableValidationContext, TableRowValue } from "../types";

describe("validateMessages", () => {
  const createContext = (
    rows: Record<string, TableRowValue>[]
  ): TableValidationContext => ({
    documentId: "doc-1",
    sectionKey: "messages",
    fieldKey: "messages",
    rows,
    columns: [
      { key: "messageId", label: "メッセージID" },
      { key: "messageType", label: "種別" },
      { key: "condition", label: "表示条件" },
      { key: "messageText", label: "文言" },
      { key: "note", label: "備考" },
    ],
  });

  it("should return no issues for valid messages", () => {
    const context = createContext([
      { messageId: "MSG_001", messageType: "info", messageText: "処理が完了しました" },
      { messageId: "MSG_002", messageType: "error", messageText: "エラーが発生しました", condition: "入力値が不正" },
    ]);

    const issues = validateMessages(context);
    const errors = issues.filter((i) => i.severity === "error");
    expect(errors).toHaveLength(0);
  });

  it("should detect duplicate message IDs", () => {
    const context = createContext([
      { messageId: "MSG_001", messageType: "info", messageText: "成功しました" },
      { messageId: "MSG_001", messageType: "error", messageText: "失敗しました" },
    ]);

    const issues = validateMessages(context);
    const duplicateIssue = issues.find((i) => i.id.includes("duplicate"));
    expect(duplicateIssue).toBeDefined();
    expect(duplicateIssue?.severity).toBe("error");
  });

  it("should detect missing required fields", () => {
    const context = createContext([
      { messageId: "MSG_001", messageType: "info", messageText: "" },
      { messageId: "", messageType: "error", messageText: "エラー" },
    ]);

    const issues = validateMessages(context);
    const requiredIssues = issues.filter((i) => i.id.includes("required"));
    expect(requiredIssues.length).toBeGreaterThan(0);
  });

  it("should inform about non-standard message types", () => {
    const context = createContext([
      { messageId: "MSG_001", messageType: "customType", messageText: "カスタムメッセージ" },
    ]);

    const issues = validateMessages(context);
    const typeIssue = issues.find((i) => i.id.includes("invalid-message-type"));
    expect(typeIssue).toBeDefined();
    expect(typeIssue?.severity).toBe("info");
  });

  it("should accept standard message types", () => {
    const context = createContext([
      { messageId: "MSG_001", messageType: "info", messageText: "情報メッセージ" },
      { messageId: "MSG_002", messageType: "error", messageText: "エラーメッセージ" },
      { messageId: "MSG_003", messageType: "warning", messageText: "警告メッセージ" },
      { messageId: "MSG_004", messageType: "confirm", messageText: "確認メッセージ" },
    ]);

    const issues = validateMessages(context);
    const typeIssues = issues.filter((i) => i.id.includes("invalid-message-type"));
    expect(typeIssues).toHaveLength(0);
  });

  it("should warn about short messages", () => {
    const context = createContext([
      { messageId: "MSG_001", messageType: "info", messageText: "OK" },
    ]);

    const issues = validateMessages(context);
    const shortIssue = issues.find((i) => i.id.includes("short-message"));
    expect(shortIssue).toBeDefined();
    expect(shortIssue?.severity).toBe("info");
  });

  it("should warn about undocumented placeholders", () => {
    const context = createContext([
      { messageId: "MSG_001", messageType: "info", messageText: "{{userName}}様、こんにちは" },
    ]);

    const issues = validateMessages(context);
    const placeholderIssue = issues.find((i) => i.id.includes("undocumented-placeholders"));
    expect(placeholderIssue).toBeDefined();
    expect(placeholderIssue?.severity).toBe("warning");
  });

  it("should suggest condition for error messages", () => {
    const context = createContext([
      { messageId: "MSG_001", messageType: "error", messageText: "エラーが発生しました" },
    ]);

    const issues = validateMessages(context);
    const conditionIssue = issues.find((i) => i.id.includes("error-without-condition"));
    expect(conditionIssue).toBeDefined();
    expect(conditionIssue?.severity).toBe("info");
  });

  it("should not warn when condition is set for error messages", () => {
    const context = createContext([
      { messageId: "MSG_001", messageType: "error", messageText: "エラーが発生しました", condition: "入力値が不正な場合" },
    ]);

    const issues = validateMessages(context);
    const conditionIssue = issues.find((i) => i.id.includes("error-without-condition"));
    expect(conditionIssue).toBeUndefined();
  });

  it("should suggest uppercase format for message IDs", () => {
    const context = createContext([
      { messageId: "msg001", messageType: "info", messageText: "メッセージ" },
      { messageId: "message-1", messageType: "info", messageText: "メッセージ" },
    ]);

    const issues = validateMessages(context);
    const formatIssues = issues.filter((i) => i.id.includes("invalid-message-id-format"));
    expect(formatIssues.length).toBe(2);
    expect(formatIssues[0]?.severity).toBe("info");
  });

  it("should skip empty rows", () => {
    const context = createContext([
      { messageId: "", messageText: "" },
      { messageId: "MSG_001", messageType: "info", messageText: "メッセージ" },
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
