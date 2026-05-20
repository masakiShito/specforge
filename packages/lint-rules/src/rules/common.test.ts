import { describe, it, expect } from "vitest";
import {
  getDisplayValue,
  isCellEmpty,
  findDuplicateKeys,
  findEmptyRows,
  createIssue,
  validateDuplicateKeys,
} from "./common";
import type { ReferenceValue, TableValidationContext } from "../types";

describe("getDisplayValue", () => {
  it("should return empty string for null", () => {
    expect(getDisplayValue(null)).toBe("");
  });

  it("should return empty string for undefined", () => {
    expect(getDisplayValue(undefined)).toBe("");
  });

  it("should return string as-is", () => {
    expect(getDisplayValue("hello")).toBe("hello");
  });

  it("should convert number to string", () => {
    expect(getDisplayValue(123)).toBe("123");
  });

  it("should convert boolean to string", () => {
    expect(getDisplayValue(true)).toBe("true");
    expect(getDisplayValue(false)).toBe("false");
  });

  it("should return displayValue for reference", () => {
    const ref: ReferenceValue = {
      type: "reference",
      referenceType: "screen-field",
      targetDocumentId: "doc-1",
      targetKey: "field-1",
      displayValue: "User Name",
    };
    expect(getDisplayValue(ref)).toBe("User Name");
  });

  it("should join array values", () => {
    expect(getDisplayValue(["a", "b", "c"])).toBe("a, b, c");
  });
});

describe("isCellEmpty", () => {
  it("should return true for null", () => {
    expect(isCellEmpty(null)).toBe(true);
  });

  it("should return true for undefined", () => {
    expect(isCellEmpty(undefined)).toBe(true);
  });

  it("should return true for empty string", () => {
    expect(isCellEmpty("")).toBe(true);
    expect(isCellEmpty("  ")).toBe(true);
  });

  it("should return false for non-empty string", () => {
    expect(isCellEmpty("hello")).toBe(false);
  });

  it("should return false for number", () => {
    expect(isCellEmpty(0)).toBe(false);
    expect(isCellEmpty(123)).toBe(false);
  });

  it("should return false for boolean", () => {
    expect(isCellEmpty(false)).toBe(false);
    expect(isCellEmpty(true)).toBe(false);
  });

  it("should return true for empty array", () => {
    expect(isCellEmpty([])).toBe(true);
  });

  it("should return false for non-empty array", () => {
    expect(isCellEmpty(["a"])).toBe(false);
  });

  it("should handle reference with empty displayValue", () => {
    const ref: ReferenceValue = {
      type: "reference",
      referenceType: "screen-field",
      targetDocumentId: "doc-1",
      targetKey: "field-1",
      displayValue: "",
    };
    expect(isCellEmpty(ref)).toBe(true);
  });

  it("should handle reference with non-empty displayValue", () => {
    const ref: ReferenceValue = {
      type: "reference",
      referenceType: "screen-field",
      targetDocumentId: "doc-1",
      targetKey: "field-1",
      displayValue: "User Name",
    };
    expect(isCellEmpty(ref)).toBe(false);
  });
});

describe("findDuplicateKeys", () => {
  it("should return empty array when no duplicates", () => {
    const rows = [
      { id: "field-1", label: "Field 1" },
      { id: "field-2", label: "Field 2" },
      { id: "field-3", label: "Field 3" },
    ];
    expect(findDuplicateKeys(rows, "id")).toEqual([]);
  });

  it("should find duplicate keys", () => {
    const rows = [
      { id: "field-1", label: "Field 1" },
      { id: "field-2", label: "Field 2" },
      { id: "field-1", label: "Field 1 Duplicate" },
    ];
    const duplicates = findDuplicateKeys(rows, "id");
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0]).toEqual({ value: "field-1", indices: [0, 2] });
  });

  it("should find multiple duplicate groups", () => {
    const rows = [
      { id: "a", label: "A1" },
      { id: "b", label: "B1" },
      { id: "a", label: "A2" },
      { id: "b", label: "B2" },
    ];
    const duplicates = findDuplicateKeys(rows, "id");
    expect(duplicates).toHaveLength(2);
  });

  it("should ignore empty values", () => {
    const rows = [
      { id: "", label: "Field 1" },
      { id: "", label: "Field 2" },
      { id: "field-3", label: "Field 3" },
    ];
    expect(findDuplicateKeys(rows, "id")).toEqual([]);
  });
});

describe("findEmptyRows", () => {
  it("should return empty array when no empty rows", () => {
    const rows = [
      { id: "field-1", label: "Field 1" },
      { id: "field-2", label: "Field 2" },
    ];
    expect(findEmptyRows(rows, ["id", "label"])).toEqual([]);
  });

  it("should find empty rows", () => {
    const rows = [
      { id: "field-1", label: "Field 1" },
      { id: "", label: "" },
      { id: "field-3", label: "Field 3" },
    ];
    expect(findEmptyRows(rows, ["id", "label"])).toEqual([1]);
  });

  it("should consider row empty only when all required columns are empty", () => {
    const rows = [
      { id: "field-1", label: "" },
      { id: "", label: "Field 2" },
      { id: "", label: "" },
    ];
    expect(findEmptyRows(rows, ["id", "label"])).toEqual([2]);
  });
});

describe("createIssue", () => {
  it("should create issue with required fields", () => {
    const issue = createIssue("test-issue", "error", "Test message");
    expect(issue).toEqual({
      id: "test-issue",
      severity: "error",
      message: "Test message",
    });
  });

  it("should create issue with optional fields", () => {
    const issue = createIssue("test-issue", "warning", "Test message", {
      documentId: "doc-1",
      sectionKey: "section-1",
      fieldKey: "field-1",
      rowIndex: 0,
      cellKey: "id",
    });
    expect(issue).toEqual({
      id: "test-issue",
      severity: "warning",
      message: "Test message",
      documentId: "doc-1",
      sectionKey: "section-1",
      fieldKey: "field-1",
      rowIndex: 0,
      cellKey: "id",
    });
  });
});

describe("validateDuplicateKeys", () => {
  it("should return issues for duplicate keys", () => {
    const context: TableValidationContext = {
      documentId: "doc-1",
      sectionKey: "section-1",
      fieldKey: "screen-fields",
      rows: [
        { fieldKey: "field-1", name: "Field 1" },
        { fieldKey: "field-2", name: "Field 2" },
        { fieldKey: "field-1", name: "Field 1 Dup" },
      ],
      columns: [],
    };

    const issues = validateDuplicateKeys(context, "fieldKey", "項目キー");
    expect(issues).toHaveLength(1);
    expect(issues[0]?.severity).toBe("error");
    expect(issues[0]?.message).toContain("field-1");
    expect(issues[0]?.message).toContain("重複");
  });
});
