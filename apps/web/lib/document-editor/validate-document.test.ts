import { describe, it, expect } from "vitest";
import { validateDocument } from "./validate-document";
import type { DocumentEditorState } from "./create-document-state";
import type { Document } from "@specforge/document-schema";

function createTestDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: "test-doc",
    key: "test-document",
    title: "Test Document",
    required: true,
    kind: "screen-spec",
    version: "1.0.0",
    sections: [],
    ...overrides,
  };
}

function createTestState(
  document: Document,
  fieldValues: Record<string, unknown> = {}
): DocumentEditorState {
  return {
    document,
    fieldValues,
  };
}

describe("validateDocument", () => {
  describe("required field validation", () => {
    it("should return no warnings when all required fields are filled", () => {
      const document = createTestDocument({
        sections: [
          {
            id: "section-1",
            key: "overview",
            title: "Overview",
            required: true,
            fields: [
              {
                id: "field-1",
                key: "purpose",
                label: "Purpose",
                required: true,
                valueType: "text",
              },
            ],
          },
        ],
      });
      const state = createTestState(document, {
        "field-1": "Some purpose text",
      });

      const result = validateDocument(state);

      expect(result.warnings).toHaveLength(0);
      expect(result.missingRequiredBySection["section-1"]).toBe(0);
    });

    it("should return warning when required text field is empty", () => {
      const document = createTestDocument({
        sections: [
          {
            id: "section-1",
            key: "overview",
            title: "Overview",
            required: true,
            fields: [
              {
                id: "field-1",
                key: "purpose",
                label: "Purpose",
                required: true,
                valueType: "text",
              },
            ],
          },
        ],
      });
      const state = createTestState(document, {
        "field-1": "",
      });

      const result = validateDocument(state);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].fieldId).toBe("field-1");
      expect(result.missingRequiredBySection["section-1"]).toBe(1);
    });

    it("should return warning when required field is undefined", () => {
      const document = createTestDocument({
        sections: [
          {
            id: "section-1",
            key: "overview",
            title: "Overview",
            required: true,
            fields: [
              {
                id: "field-1",
                key: "purpose",
                label: "Purpose",
                required: true,
                valueType: "text",
              },
            ],
          },
        ],
      });
      const state = createTestState(document, {});

      const result = validateDocument(state);

      expect(result.warnings).toHaveLength(1);
      expect(result.missingRequiredBySection["section-1"]).toBe(1);
    });

    it("should not return warning for optional empty fields", () => {
      const document = createTestDocument({
        sections: [
          {
            id: "section-1",
            key: "overview",
            title: "Overview",
            required: true,
            fields: [
              {
                id: "field-1",
                key: "notes",
                label: "Notes",
                required: false,
                valueType: "text",
              },
            ],
          },
        ],
      });
      const state = createTestState(document, {
        "field-1": "",
      });

      const result = validateDocument(state);

      expect(result.warnings).toHaveLength(0);
    });
  });

  describe("table field validation", () => {
    it("should return warning for required table with no rows", () => {
      const document = createTestDocument({
        sections: [
          {
            id: "section-1",
            key: "screen-fields",
            title: "Screen Fields",
            required: true,
            fields: [
              {
                id: "field-table",
                key: "fields",
                label: "Fields",
                required: true,
                valueType: "table",
                table: {
                  id: "table-1",
                  key: "fields",
                  title: "Fields",
                  required: true,
                  columns: [
                    {
                      id: "col-1",
                      key: "name",
                      label: "Name",
                      required: true,
                      valueType: "text",
                    },
                  ],
                },
              },
            ],
          },
        ],
      });
      const state = createTestState(document, {
        "field-table": [],
      });

      const result = validateDocument(state);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].message).toContain("テーブル");
    });

    it("should return warning for empty row in table", () => {
      const document = createTestDocument({
        sections: [
          {
            id: "section-1",
            key: "screen-fields",
            title: "Screen Fields",
            required: true,
            fields: [
              {
                id: "field-table",
                key: "fields",
                label: "Fields",
                required: true,
                valueType: "table",
                table: {
                  id: "table-1",
                  key: "fields",
                  title: "Fields",
                  required: true,
                  columns: [
                    {
                      id: "col-1",
                      key: "name",
                      label: "Name",
                      required: true,
                      valueType: "text",
                    },
                  ],
                },
              },
            ],
          },
        ],
      });
      const state = createTestState(document, {
        "field-table": [{ name: "" }],
      });

      const result = validateDocument(state);

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("should validate required cells in table rows", () => {
      const document = createTestDocument({
        sections: [
          {
            id: "section-1",
            key: "screen-fields",
            title: "Screen Fields",
            required: true,
            fields: [
              {
                id: "field-table",
                key: "fields",
                label: "Fields",
                required: true,
                valueType: "table",
                table: {
                  id: "table-1",
                  key: "fields",
                  title: "Fields",
                  required: true,
                  columns: [
                    {
                      id: "col-1",
                      key: "name",
                      label: "Name",
                      required: true,
                      valueType: "text",
                    },
                    {
                      id: "col-2",
                      key: "type",
                      label: "Type",
                      required: true,
                      valueType: "text",
                    },
                  ],
                },
              },
            ],
          },
        ],
      });
      const state = createTestState(document, {
        "field-table": [{ name: "Field1", type: "" }],
      });

      const result = validateDocument(state);

      const cellWarning = result.warnings.find((w) =>
        w.message.includes("必須")
      );
      expect(cellWarning).toBeDefined();
    });
  });

  describe("multiple sections", () => {
    it("should track missing required fields by section", () => {
      const document = createTestDocument({
        sections: [
          {
            id: "section-1",
            key: "overview",
            title: "Overview",
            required: true,
            fields: [
              {
                id: "field-1",
                key: "purpose",
                label: "Purpose",
                required: true,
                valueType: "text",
              },
              {
                id: "field-2",
                key: "scope",
                label: "Scope",
                required: true,
                valueType: "text",
              },
            ],
          },
          {
            id: "section-2",
            key: "details",
            title: "Details",
            required: true,
            fields: [
              {
                id: "field-3",
                key: "description",
                label: "Description",
                required: true,
                valueType: "textarea",
              },
            ],
          },
        ],
      });
      const state = createTestState(document, {
        "field-1": "",
        "field-2": "",
        "field-3": "",
      });

      const result = validateDocument(state);

      expect(result.missingRequiredBySection["section-1"]).toBe(2);
      expect(result.missingRequiredBySection["section-2"]).toBe(1);
    });
  });
});
