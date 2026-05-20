import { describe, it, expect } from "vitest";
import {
  validateDocument,
  validateDocuments,
  type ValidatableDocument,
} from "./document-validator";

describe("validateDocument", () => {
  it("should return valid result for document with no issues", () => {
    const document: ValidatableDocument = {
      id: "doc-1",
      kind: "screen-spec",
      title: "Test Screen",
      sections: [
        {
          key: "overview",
          title: "概要",
          fields: [
            {
              key: "description",
              type: "text",
              value: "This is a test screen",
            },
          ],
        },
      ],
    };

    const result = validateDocument(document);
    expect(result.isValid).toBe(true);
    expect(result.errorCount).toBe(0);
  });

  it("should validate screen-spec table fields", () => {
    const document: ValidatableDocument = {
      id: "doc-1",
      kind: "screen-spec",
      title: "Test Screen",
      sections: [
        {
          key: "screen-fields",
          title: "画面項目",
          fields: [
            {
              key: "screen-fields",
              type: "table",
              value: [
                { name: "ユーザー名", fieldKey: "userName", inputType: "text" },
                { name: "ユーザー名2", fieldKey: "userName", inputType: "text" }, // duplicate
              ],
            },
          ],
        },
      ],
    };

    const result = validateDocument(document);
    expect(result.errorCount).toBeGreaterThan(0);
    expect(result.isValid).toBe(false);
  });

  it("should validate api-spec endpoints", () => {
    const document: ValidatableDocument = {
      id: "doc-1",
      kind: "api-spec",
      title: "Test API",
      sections: [
        {
          key: "endpoints",
          title: "エンドポイント",
          fields: [
            {
              key: "endpoints",
              type: "table",
              value: [
                { path: "/users", method: "GET", description: "ユーザー一覧" },
                { path: "users", method: "POST", description: "ユーザー作成" }, // invalid path
              ],
            },
          ],
        },
      ],
    };

    const result = validateDocument(document);
    const pathIssue = result.issues.find((i) =>
      i.message.includes("/で始まる")
    );
    expect(pathIssue).toBeDefined();
  });

  it("should count issues by severity", () => {
    const document: ValidatableDocument = {
      id: "doc-1",
      kind: "screen-spec",
      title: "Test Screen",
      sections: [
        {
          key: "screen-fields",
          title: "画面項目",
          fields: [
            {
              key: "screen-fields",
              type: "table",
              value: [
                { name: "", fieldKey: "", inputType: "" }, // empty row - warning
                { name: "選択", fieldKey: "select1", inputType: "select", options: "" }, // missing options - error
              ],
            },
          ],
        },
      ],
    };

    const result = validateDocument(document);
    expect(result.errorCount).toBeGreaterThan(0);
    expect(result.warningCount).toBeGreaterThan(0);
  });
});

describe("validateDocuments", () => {
  it("should validate multiple documents", () => {
    const documents: ValidatableDocument[] = [
      {
        id: "doc-1",
        kind: "screen-spec",
        title: "Screen 1",
        sections: [
          {
            key: "screen-fields",
            title: "画面項目",
            fields: [
              {
                key: "screen-fields",
                type: "table",
                value: [
                  { name: "Field 1", fieldKey: "field1", inputType: "text" },
                  { name: "Field 1 Dup", fieldKey: "field1", inputType: "text" }, // duplicate
                ],
              },
            ],
          },
        ],
      },
      {
        id: "doc-2",
        kind: "screen-spec",
        title: "Screen 2",
        sections: [
          {
            key: "screen-fields",
            title: "画面項目",
            fields: [
              {
                key: "screen-fields",
                type: "table",
                value: [
                  { name: "Field 2", fieldKey: "field2", inputType: "text" },
                  { name: "Field 2 Dup", fieldKey: "field2", inputType: "text" }, // duplicate
                ],
              },
            ],
          },
        ],
      },
    ];

    const result = validateDocuments(documents);
    // Should have 2 duplicate errors, one from each document
    const duplicateErrors = result.issues.filter((i) =>
      i.id.includes("duplicate")
    );
    expect(duplicateErrors).toHaveLength(2);
  });

  it("should aggregate issue counts from all documents", () => {
    const documents: ValidatableDocument[] = [
      {
        id: "doc-1",
        kind: "screen-spec",
        title: "Screen 1",
        sections: [],
      },
      {
        id: "doc-2",
        kind: "api-spec",
        title: "API 1",
        sections: [],
      },
    ];

    const result = validateDocuments(documents);
    expect(result.isValid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });
});
