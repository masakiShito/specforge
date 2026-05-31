import { describe, expect, it } from "vitest";

import {
  findDuplicateKeys,
  findEmptyRows,
  getCellReferenceDocumentId,
  getCellReferenceId,
  getDisplayValue,
  isCellEmpty,
} from "./common";
import type { TableValidationContext } from "../types";

describe("common rule helpers", () => {
  it("handles web reference values", () => {
    const row = {
      apiRef: { refId: "api-1", kind: "document", documentId: "doc-api" },
    };

    expect(getCellReferenceId(row, "apiRef")).toBe("api-1");
    expect(getCellReferenceDocumentId(row, "apiRef")).toBe("doc-api");
    expect(getDisplayValue(row.apiRef)).toBe("api-1");
  });

  it("keeps web empty-cell semantics", () => {
    expect(isCellEmpty(undefined)).toBe(true);
    expect(isCellEmpty(null)).toBe(true);
    expect(isCellEmpty("")).toBe(true);
    expect(isCellEmpty("  ")).toBe(false);
    expect(isCellEmpty(false)).toBe(false);
  });

  it("supports legacy duplicate and empty row helper calls", () => {
    expect(findDuplicateKeys([
      { id: "a" },
      { id: "b" },
      { id: "a" },
    ], "id")).toEqual([{ value: "a", indices: [0, 2] }]);

    expect(findEmptyRows([
      { id: "a", label: "" },
      { id: "", label: "" },
    ], ["id", "label"])).toEqual([1]);
  });

  it("creates web-shaped duplicate validation issues", () => {
    const ctx: TableValidationContext = {
      documentId: "doc",
      sectionId: "section",
      sectionTitle: "Section",
      fieldId: "field",
      fieldLabel: "Field",
      tableKey: "table",
    };

    const issues = findDuplicateKeys([
      { key: "dup" },
      { key: "dup" },
    ], "key", "キー", ctx);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      severity: "error",
      documentId: "doc",
      sectionId: "section",
      fieldId: "field",
      columnKey: "key",
    });
  });
});
