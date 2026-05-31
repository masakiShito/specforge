import type { Document, Project } from "@specforge/document-schema";
import { beforeEach, describe, expect, it } from "vitest";

import type { DocumentEditorState } from "../document-editor/create-document-state";
import { clearValidationCaches } from "./validation-cache";
import { validateDesignQuality } from "./validate-design-quality";

function createDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: "doc",
    key: "doc",
    title: "Document",
    required: true,
    kind: "screen-spec",
    version: "1.0.0",
    sections: [],
    ...overrides,
  };
}

function createProject(targetTitle: string): Project {
  return {
    id: "project",
    key: "project",
    title: "Project",
    required: true,
    documents: [
      createApiConnectionDocument(),
      createDocument({ id: "target", title: targetTitle }),
    ],
  };
}

function createApiConnectionDocument(): Document {
  return createDocument({
    id: "current",
    title: "Current Screen",
    sections: [
      {
        id: "api-connections-section",
        key: "api-connections",
        title: "API Connections",
        required: false,
        fields: [
          {
            id: "api-connections-field",
            key: "api-connections",
            label: "API Connections",
            required: false,
            valueType: "table",
            table: {
              id: "api-connections-table",
              key: "api-connections",
              title: "API Connections",
              required: false,
              columns: [
                { id: "api-ref-column", key: "apiRef", label: "API Reference", required: true, valueType: "reference" },
                { id: "timing-column", key: "timing", label: "Timing", required: true, valueType: "text" },
                { id: "purpose-column", key: "purpose", label: "Purpose", required: true, valueType: "text" },
              ],
            },
          },
        ],
      },
    ],
  });
}

function createApiConnectionState(): DocumentEditorState {
  return {
    document: createApiConnectionDocument(),
    fieldValues: {
      "api-connections-field": [
        {
          apiRef: { refId: "target", kind: "document", documentId: "target" },
          timing: "on load",
          purpose: "fetch data",
        },
      ],
    },
  };
}

function findWrongKindReason(result: ReturnType<typeof validateDesignQuality>): string {
  const issue = result.issues.find((item) => item.id.endsWith(":ref-wrong-kind"));
  expect(issue).toBeDefined();
  return issue?.reason ?? "";
}

describe("validateDesignQuality", () => {
  beforeEach(() => {
    clearValidationCaches();
  });

  it("uses lint-rules validators for tables moved out of apps/web", () => {
    const document = createDocument({
      kind: "er-spec",
      sections: [
        {
          id: "entities-section",
          key: "entities",
          title: "Entities",
          required: true,
          fields: [
            {
              id: "entities-field",
              key: "entities",
              label: "Entities",
              required: true,
              valueType: "table",
              table: {
                id: "entities-table",
                key: "entities",
                title: "Entities",
                required: true,
                columns: [
                  { id: "entity-name", key: "entityName", label: "Entity Name", required: true, valueType: "text" },
                  { id: "physical-name", key: "physicalName", label: "Physical Name", required: true, valueType: "text" },
                ],
              },
            },
          ],
        },
      ],
    });
    const state: DocumentEditorState = {
      document,
      fieldValues: {
        "entities-field": [
          { entityName: "User", physicalName: "users" },
          { entityName: "User", physicalName: "123-invalid" },
        ],
      },
    };

    const result = validateDesignQuality(state);

    expect(result.issues.some((issue) => issue.id.endsWith(":entityName:duplicate"))).toBe(true);
    expect(result.issues.some((issue) => issue.columnKey === "physicalName" && issue.severity === "warning")).toBe(true);
  });

  it("does not reuse a cached result when project metadata changes", () => {
    const state = createApiConnectionState();
    const firstResult = validateDesignQuality(state, createProject("First Target"));

    expect(findWrongKindReason(firstResult)).toContain("First Target");

    const secondResult = validateDesignQuality(state, createProject("Second Target"));

    expect(secondResult).not.toBe(firstResult);
    expect(findWrongKindReason(secondResult)).toContain("Second Target");
  });

  it("reuses a cached result for the same state and project metadata", () => {
    const state = createApiConnectionState();
    const project = createProject("Target");

    const firstResult = validateDesignQuality(state, project);
    const secondResult = validateDesignQuality(state, project);

    expect(secondResult).toBe(firstResult);
  });
});
