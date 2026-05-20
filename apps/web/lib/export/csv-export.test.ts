import { describe, it, expect } from "vitest";
import {
  exportTableToCsv,
  exportMultipleTablesToCsv,
  generateCsvFilename,
} from "./csv-export";
import type { Field } from "@specforge/document-schema";

describe("exportTableToCsv", () => {
  const mockColumns: Field[] = [
    { id: "col-1", key: "name", label: "名前", required: true, valueType: "text" },
    { id: "col-2", key: "type", label: "タイプ", required: true, valueType: "text" },
    { id: "col-3", key: "required", label: "必須", required: false, valueType: "boolean" },
  ];

  const mockRows = [
    { name: "user_id", type: "string", required: true },
    { name: "email", type: "string", required: false },
  ];

  it("should export table to valid CSV", () => {
    const result = exportTableToCsv("テスト", mockColumns, mockRows);

    expect(result.success).toBe(true);
    if (result.success) {
      const lines = result.data.split("\n");
      expect(lines[0]).toBe("名前,タイプ,必須");
      expect(lines[1]).toBe("user_id,string,true");
      expect(lines[2]).toBe("email,string,false");
    }
  });

  it("should respect delimiter option", () => {
    const result = exportTableToCsv("テスト", mockColumns, mockRows, { delimiter: ";" });

    expect(result.success).toBe(true);
    if (result.success) {
      const lines = result.data.split("\n");
      expect(lines[0]).toBe("名前;タイプ;必須");
    }
  });

  it("should support excluding header", () => {
    const result = exportTableToCsv("テスト", mockColumns, mockRows, { includeHeader: false });

    expect(result.success).toBe(true);
    if (result.success) {
      const lines = result.data.split("\n");
      expect(lines[0]).toBe("user_id,string,true");
    }
  });

  it("should escape cells containing delimiter", () => {
    const rowsWithComma = [
      { name: "field,with,commas", type: "string", required: true },
    ];

    const result = exportTableToCsv("テスト", mockColumns, rowsWithComma);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain('"field,with,commas"');
    }
  });

  it("should escape cells containing quotes", () => {
    const rowsWithQuotes = [
      { name: 'field"with"quotes', type: "string", required: true },
    ];

    const result = exportTableToCsv("テスト", mockColumns, rowsWithQuotes);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain('"field""with""quotes"');
    }
  });

  it("should escape cells containing newlines", () => {
    const rowsWithNewlines = [
      { name: "field\nwith\nnewlines", type: "string", required: true },
    ];

    const result = exportTableToCsv("テスト", mockColumns, rowsWithNewlines);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain('"field\nwith\nnewlines"');
    }
  });

  it("should handle null and undefined values", () => {
    const rowsWithNulls = [
      { name: "test", type: null, required: undefined },
    ];

    const result = exportTableToCsv("テスト", mockColumns, rowsWithNulls);

    expect(result.success).toBe(true);
    if (result.success) {
      const lines = result.data.split("\n");
      expect(lines[1]).toBe("test,,");
    }
  });

  it("should handle enum values with labels", () => {
    const columnsWithEnum: Field[] = [
      {
        id: "col-1",
        key: "status",
        label: "ステータス",
        required: true,
        valueType: "enum",
        options: [
          { value: "active", label: "有効" },
          { value: "inactive", label: "無効" },
        ],
      },
    ];

    const rows = [{ status: "active" }];
    const result = exportTableToCsv("テスト", columnsWithEnum, rows);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain("有効");
    }
  });

  it("should handle empty rows array", () => {
    const result = exportTableToCsv("テスト", mockColumns, []);

    expect(result.success).toBe(true);
    if (result.success) {
      const lines = result.data.split("\n");
      expect(lines.length).toBe(1); // header only
    }
  });
});

describe("exportMultipleTablesToCsv", () => {
  it("should export multiple tables with section headers", () => {
    const tables = [
      {
        tableName: "ユーザー",
        columns: [
          { id: "1", key: "name", label: "名前", required: true, valueType: "text" as const },
        ],
        rows: [{ name: "田中" }],
      },
      {
        tableName: "ロール",
        columns: [
          { id: "1", key: "role", label: "ロール", required: true, valueType: "text" as const },
        ],
        rows: [{ role: "admin" }],
      },
    ];

    const result = exportMultipleTablesToCsv(tables);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain("# ユーザー");
      expect(result.data).toContain("# ロール");
      expect(result.data).toContain("田中");
      expect(result.data).toContain("admin");
    }
  });

  it("should separate tables with blank lines", () => {
    const tables = [
      {
        tableName: "Table1",
        columns: [{ id: "1", key: "a", label: "A", required: true, valueType: "text" as const }],
        rows: [{ a: "1" }],
      },
      {
        tableName: "Table2",
        columns: [{ id: "1", key: "b", label: "B", required: true, valueType: "text" as const }],
        rows: [{ b: "2" }],
      },
    ];

    const result = exportMultipleTablesToCsv(tables);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain("\n\n");
    }
  });

  it("should handle empty tables array", () => {
    const result = exportMultipleTablesToCsv([]);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("");
    }
  });
});

describe("generateCsvFilename", () => {
  it("should generate filename with table name", () => {
    const filename = generateCsvFilename("要素一覧");

    expect(filename).toMatch(/^_+_\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it("should include document title when provided", () => {
    const filename = generateCsvFilename("elements", "LoginScreen");

    expect(filename).toMatch(/^LoginScreen_elements_\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it("should sanitize special characters", () => {
    const filename = generateCsvFilename("test/table:name");

    expect(filename).not.toContain("/");
    expect(filename).not.toContain(":");
    expect(filename).toMatch(/\.csv$/);
  });

  it("should sanitize Japanese characters", () => {
    const filename = generateCsvFilename("テーブル名");

    expect(filename).not.toContain("テーブル名");
    expect(filename).toMatch(/\.csv$/);
  });
});
