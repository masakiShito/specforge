import { describe, expect, it } from "vitest";

import {
  validateDocument,
  validateDocuments,
  type ValidatableDocument,
} from "./document-validator";

describe("validateDocument", () => {
  it("validates migrated table rules through the document validator", () => {
    const document: ValidatableDocument = {
      id: "doc-1",
      kind: "screen-spec",
      title: "Test Screen",
      sections: [
        {
          key: "screen-fields",
          title: "Screen Fields",
          fields: [
            {
              key: "screen-fields",
              type: "table",
              value: [
                { name: "User", fieldKey: "user", inputType: "text" },
                { name: "User duplicate", fieldKey: "user", inputType: "text" },
              ],
              columns: [
                { key: "name", label: "Name" },
                { key: "fieldKey", label: "Field Key" },
                { key: "inputType", label: "Input Type" },
              ],
            },
          ],
        },
      ],
    };

    const result = validateDocument(document);

    expect(result.isValid).toBe(false);
    expect(result.errorCount).toBe(1);
    expect(result.issues[0]).toMatchObject({
      documentId: "doc-1",
      sectionId: "screen-fields",
      fieldId: "screen-fields",
    });
  });

  it("returns valid result for documents without matching table rules", () => {
    const document: ValidatableDocument = {
      id: "doc-1",
      kind: "screen-spec",
      title: "Test Screen",
      sections: [{ key: "overview", title: "Overview", fields: [] }],
    };

    expect(validateDocument(document)).toMatchObject({
      isValid: true,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
    });
  });
});

describe("validateDocuments", () => {
  it("aggregates validation results from multiple documents", () => {
    const documents: ValidatableDocument[] = [
      {
        id: "doc-1",
        kind: "screen-spec",
        title: "Screen 1",
        sections: [
          {
            key: "screen-fields",
            title: "Screen Fields",
            fields: [
              {
                key: "screen-fields",
                type: "table",
                value: [
                  { name: "Field", fieldKey: "field", inputType: "text" },
                  { name: "Field duplicate", fieldKey: "field", inputType: "text" },
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
        sections: [],
      },
    ];

    const result = validateDocuments(documents);

    expect(result.errorCount).toBe(1);
    expect(result.issues.some((issue) => issue.id.endsWith(":fieldKey:duplicate"))).toBe(true);
  });
});
