import { describe, it, expect } from "vitest";
import { validateEvents, isEventsTable } from "./events";
import type { TableValidationContext } from "../types";

describe("validateEvents", () => {
  const createContext = (
    rows: Record<string, unknown>[]
  ): TableValidationContext => ({
    documentId: "doc-1",
    sectionKey: "events",
    fieldKey: "events",
    rows,
    columns: [
      { key: "id", label: "イベントID" },
      { key: "trigger", label: "トリガー" },
      { key: "action", label: "アクション" },
      { key: "condition", label: "条件" },
    ],
  });

  it("should return no issues for valid events", () => {
    const context = createContext([
      { id: "onSubmit", trigger: "click", action: "フォーム送信" },
      { id: "onChange", trigger: "change", action: "値を更新" },
    ]);

    const issues = validateEvents(context);
    const errors = issues.filter((i) => i.severity === "error");
    expect(errors).toHaveLength(0);
  });

  it("should detect duplicate event IDs", () => {
    const context = createContext([
      { id: "onSubmit", trigger: "click", action: "フォーム送信" },
      { id: "onSubmit", trigger: "submit", action: "送信処理" },
    ]);

    const issues = validateEvents(context);
    const duplicateIssue = issues.find((i) => i.id.includes("duplicate"));
    expect(duplicateIssue).toBeDefined();
    expect(duplicateIssue?.severity).toBe("error");
  });

  it("should detect missing required fields", () => {
    const context = createContext([
      { id: "onSubmit", trigger: "", action: "フォーム送信" },
      { id: "", trigger: "click", action: "処理" },
    ]);

    const issues = validateEvents(context);
    const requiredIssues = issues.filter((i) => i.id.includes("required"));
    expect(requiredIssues.length).toBeGreaterThan(0);
  });

  it("should warn about non-standard trigger types", () => {
    const context = createContext([
      { id: "onCustom", trigger: "unknownTrigger", action: "カスタム処理" },
    ]);

    const issues = validateEvents(context);
    const triggerIssue = issues.find((i) => i.id.includes("invalid-trigger"));
    expect(triggerIssue).toBeDefined();
    expect(triggerIssue?.severity).toBe("warning");
  });

  it("should accept standard trigger types", () => {
    const context = createContext([
      { id: "onClick", trigger: "click", action: "クリック処理" },
      { id: "onSubmit", trigger: "submit", action: "送信処理" },
      { id: "onChange", trigger: "change", action: "変更処理" },
      { id: "onLoad", trigger: "load", action: "読み込み処理" },
    ]);

    const issues = validateEvents(context);
    const triggerIssues = issues.filter((i) => i.id.includes("invalid-trigger"));
    expect(triggerIssues).toHaveLength(0);
  });

  it("should suggest condition for conditional actions", () => {
    const context = createContext([
      { id: "onSubmit", trigger: "click", action: "条件に応じて送信" },
    ]);

    const issues = validateEvents(context);
    const conditionIssue = issues.find((i) => i.id.includes("missing-condition"));
    expect(conditionIssue).toBeDefined();
    expect(conditionIssue?.severity).toBe("info");
  });

  it("should suggest API reference for API call actions", () => {
    const context = createContext([
      { id: "onFetch", trigger: "load", action: "データをAPIから取得" },
    ]);

    const issues = validateEvents(context);
    const apiIssue = issues.find((i) => i.id.includes("event-api-reference"));
    expect(apiIssue).toBeDefined();
    expect(apiIssue?.severity).toBe("info");
  });

  it("should warn about invalid event ID format", () => {
    const context = createContext([
      { id: "123invalid", trigger: "click", action: "処理" },
      { id: "has space", trigger: "click", action: "処理" },
    ]);

    const issues = validateEvents(context);
    const formatIssues = issues.filter((i) => i.id.includes("invalid-event-id-format"));
    expect(formatIssues.length).toBeGreaterThan(0);
    expect(formatIssues[0]?.severity).toBe("warning");
  });

  it("should skip empty rows", () => {
    const context = createContext([
      { id: "", trigger: "", action: "" },
      { id: "onClick", trigger: "click", action: "処理" },
    ]);

    const issues = validateEvents(context);
    const emptyRowIssues = issues.filter((i) => i.id.includes("empty-row"));
    expect(emptyRowIssues.length).toBe(1);
  });
});

describe("isEventsTable", () => {
  it("should return true for valid field keys", () => {
    expect(isEventsTable("events")).toBe(true);
    expect(isEventsTable("eventHandlers")).toBe(true);
    expect(isEventsTable("actions")).toBe(true);
    expect(isEventsTable("interactions")).toBe(true);
  });

  it("should return false for invalid field keys", () => {
    expect(isEventsTable("fields")).toBe(false);
    expect(isEventsTable("messages")).toBe(false);
    expect(isEventsTable("other")).toBe(false);
  });
});
