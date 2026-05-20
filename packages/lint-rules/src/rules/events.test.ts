import { describe, it, expect } from "vitest";
import { validateEvents, isEventsTable } from "./events";
import type { TableValidationContext, TableRowValue } from "../types";

describe("validateEvents", () => {
  const createContext = (
    rows: Record<string, TableRowValue>[]
  ): TableValidationContext => ({
    documentId: "doc-1",
    sectionKey: "events",
    fieldKey: "events",
    rows,
    columns: [
      { key: "eventName", label: "イベント名" },
      { key: "triggerType", label: "契機" },
      { key: "actionType", label: "処理種別" },
      { key: "target", label: "対象" },
      { key: "note", label: "備考" },
    ],
  });

  it("should return no issues for valid events", () => {
    const context = createContext([
      { eventName: "submitForm", triggerType: "onSubmit", actionType: "フォーム送信" },
      { eventName: "changeValue", triggerType: "onChange", actionType: "値を更新" },
    ]);

    const issues = validateEvents(context);
    const errors = issues.filter((i) => i.severity === "error");
    expect(errors).toHaveLength(0);
  });

  it("should detect duplicate event names", () => {
    const context = createContext([
      { eventName: "submitForm", triggerType: "onClick", actionType: "フォーム送信" },
      { eventName: "submitForm", triggerType: "onSubmit", actionType: "送信処理" },
    ]);

    const issues = validateEvents(context);
    const duplicateIssue = issues.find((i) => i.id.includes("duplicate"));
    expect(duplicateIssue).toBeDefined();
    expect(duplicateIssue?.severity).toBe("error");
  });

  it("should detect missing required fields", () => {
    const context = createContext([
      { eventName: "submitForm", triggerType: "", actionType: "フォーム送信" },
      { eventName: "", triggerType: "onClick", actionType: "処理" },
    ]);

    const issues = validateEvents(context);
    const requiredIssues = issues.filter((i) => i.id.includes("required"));
    expect(requiredIssues.length).toBeGreaterThan(0);
  });

  it("should warn about non-standard trigger types", () => {
    const context = createContext([
      { eventName: "customEvent", triggerType: "unknownTrigger", actionType: "カスタム処理" },
    ]);

    const issues = validateEvents(context);
    const triggerIssue = issues.find((i) => i.id.includes("invalid-trigger"));
    expect(triggerIssue).toBeDefined();
    expect(triggerIssue?.severity).toBe("warning");
  });

  it("should accept standard trigger types", () => {
    const context = createContext([
      { eventName: "clickEvent", triggerType: "onClick", actionType: "クリック処理" },
      { eventName: "submitEvent", triggerType: "onSubmit", actionType: "送信処理" },
      { eventName: "changeEvent", triggerType: "onChange", actionType: "変更処理" },
      { eventName: "loadEvent", triggerType: "onLoad", actionType: "読み込み処理" },
    ]);

    const issues = validateEvents(context);
    const triggerIssues = issues.filter((i) => i.id.includes("invalid-trigger"));
    expect(triggerIssues).toHaveLength(0);
  });

  it("should suggest target for API call actions", () => {
    const context = createContext([
      { eventName: "fetchData", triggerType: "onLoad", actionType: "データをAPIから取得" },
    ]);

    const issues = validateEvents(context);
    const apiIssue = issues.find((i) => i.id.includes("event-api-reference"));
    expect(apiIssue).toBeDefined();
    expect(apiIssue?.severity).toBe("info");
  });

  it("should not warn when target is set for API calls", () => {
    const context = createContext([
      { eventName: "fetchData", triggerType: "onLoad", actionType: "データをAPIから取得", target: "GET /api/users" },
    ]);

    const issues = validateEvents(context);
    const apiIssue = issues.find((i) => i.id.includes("event-api-reference"));
    expect(apiIssue).toBeUndefined();
  });

  it("should skip empty rows", () => {
    const context = createContext([
      { eventName: "", triggerType: "" },
      { eventName: "clickEvent", triggerType: "onClick", actionType: "処理" },
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
