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
          key: "screen-items",
          title: "画面項目",
          fields: [
            {
              key: "fields",
              type: "table",
              value: [
                { id: "userName", label: "ユーザー名", type: "text" },
                { id: "userName", label: "ユーザー名2", type: "text" }, // duplicate
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
          key: "screen-items",
          title: "画面項目",
          fields: [
            {
              key: "fields",
              type: "table",
              value: [
                { id: "", label: "", type: "" }, // empty row - warning
                { id: "select1", label: "選択", type: "select" }, // missing options - error
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
            key: "fields",
            title: "Fields",
            fields: [
              {
                key: "fields",
                type: "table",
                value: [
                  { id: "field1", label: "Field 1", type: "text" },
                  { id: "field1", label: "Field 1 Dup", type: "text" }, // duplicate
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
            key: "fields",
            title: "Fields",
            fields: [
              {
                key: "fields",
                type: "table",
                value: [
                  { id: "field2", label: "Field 2", type: "text" },
                  { id: "field2", label: "Field 2 Dup", type: "text" }, // duplicate
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
