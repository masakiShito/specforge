import { describe, expect, it } from "vitest";

import { isScreenFieldsTable, validateScreenFields } from "./screen-fields";
import type { TableValidationContext } from "../types";

const ctx: TableValidationContext = {
  documentId: "doc",
  sectionId: "section-screen-fields",
  sectionTitle: "Screen Fields",
  fieldId: "field-screen-fields",
  fieldLabel: "Screen Fields",
  tableKey: "screen-fields",
};

const columns = [
  { key: "name", label: "項目名", required: true },
  { key: "fieldKey", label: "項目キー", required: true },
  { key: "inputType", label: "入力形式", required: true },
  { key: "required", label: "必須" },
  { key: "editable", label: "編集可" },
];

describe("validateScreenFields", () => {
  it("returns web-shaped issues for migrated screen field rules", () => {
    const issues = validateScreenFields([
      { name: "User", fieldKey: "user", inputType: "text" },
      { name: "", fieldKey: "user", inputType: "label", editable: true },
      { name: "Submit", fieldKey: "submit", inputType: "button", required: true },
    ], columns, ctx);

    expect(issues.some((issue) => issue.id.endsWith(":fieldKey:duplicate"))).toBe(true);
    expect(issues.some((issue) => issue.id.endsWith(":name:missing-with-key"))).toBe(true);
    expect(issues.some((issue) => issue.id.endsWith(":label-editable"))).toBe(true);
    expect(issues.some((issue) => issue.id.endsWith(":button-required"))).toBe(true);
    expect(issues.every((issue) => issue.documentId === "doc" && issue.sectionId === "section-screen-fields")).toBe(true);
  });
});

describe("isScreenFieldsTable", () => {
  it("recognizes web and legacy table keys", () => {
    expect(isScreenFieldsTable("screen-fields")).toBe(true);
    expect(isScreenFieldsTable("fields")).toBe(true);
    expect(isScreenFieldsTable("events")).toBe(false);
  });
});
