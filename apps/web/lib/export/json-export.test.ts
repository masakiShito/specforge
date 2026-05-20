import { describe, it, expect } from "vitest";
import {
  exportProjectToJson,
  exportDocumentToJson,
  generateProjectFilename,
  generateDocumentFilename,
} from "./json-export";
import type { Project, Document } from "@specforge/document-schema";
import type { DocumentEditorState } from "../document-editor/create-document-state";

describe("exportProjectToJson", () => {
  const mockProject: Project = {
    id: "project-1",
    key: "test-project",
    title: "Test Project",
    required: true,
    documents: [
      {
        id: "doc-1",
        key: "screen-spec-1",
        title: "Login Screen",
        kind: "screen-spec",
        version: "1.0.0",
        required: true,
        sections: [],
      },
    ],
  };

  const mockDocumentStates: DocumentEditorState[] = [
    {
      document: mockProject.documents[0],
      fieldValues: { "field-1": "test value" },
    },
  ];

  it("should export project to valid JSON", () => {
    const result = exportProjectToJson(mockProject, mockDocumentStates);

    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = JSON.parse(result.data);
      expect(parsed.version).toBe("1.0.0");
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.project.id).toBe("project-1");
      expect(parsed.project.title).toBe("Test Project");
      expect(parsed.documentStates).toHaveLength(1);
    }
  });

  it("should include all document states", () => {
    const result = exportProjectToJson(mockProject, mockDocumentStates);

    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = JSON.parse(result.data);
      expect(parsed.documentStates[0].fieldValues["field-1"]).toBe("test value");
    }
  });

  it("should format JSON with indentation", () => {
    const result = exportProjectToJson(mockProject, mockDocumentStates);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain("\n");
      expect(result.data).toContain("  ");
    }
  });
});

describe("exportDocumentToJson", () => {
  const mockDocument: Document = {
    id: "doc-1",
    key: "screen-spec-1",
    title: "Login Screen",
    kind: "screen-spec",
    version: "1.0.0",
    required: true,
    sections: [
      {
        id: "section-1",
        key: "overview",
        title: "Overview",
        required: true,
        fields: [],
      },
    ],
  };

  const mockFieldValues = {
    "field-1": "value 1",
    "field-2": 123,
    "field-3": true,
  };

  it("should export document to valid JSON", () => {
    const result = exportDocumentToJson(mockDocument, mockFieldValues);

    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = JSON.parse(result.data);
      expect(parsed.version).toBe("1.0.0");
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.document.id).toBe("doc-1");
      expect(parsed.document.title).toBe("Login Screen");
    }
  });

  it("should include all field values", () => {
    const result = exportDocumentToJson(mockDocument, mockFieldValues);

    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = JSON.parse(result.data);
      expect(parsed.fieldValues["field-1"]).toBe("value 1");
      expect(parsed.fieldValues["field-2"]).toBe(123);
      expect(parsed.fieldValues["field-3"]).toBe(true);
    }
  });
});

describe("generateProjectFilename", () => {
  it("should generate filename with sanitized title", () => {
    const project: Project = {
      id: "1",
      key: "test",
      title: "Test Project",
      required: true,
      documents: [],
    };

    const filename = generateProjectFilename(project);

    expect(filename).toMatch(/^Test_Project_\d{4}-\d{2}-\d{2}\.json$/);
  });

  it("should sanitize special characters in title", () => {
    const project: Project = {
      id: "1",
      key: "test",
      title: "Test/Project:With*Special?Chars",
      required: true,
      documents: [],
    };

    const filename = generateProjectFilename(project);

    expect(filename).not.toContain("/");
    expect(filename).not.toContain(":");
    expect(filename).not.toContain("*");
    expect(filename).not.toContain("?");
  });
});

describe("generateDocumentFilename", () => {
  it("should generate filename with sanitized title", () => {
    const document: Document = {
      id: "1",
      key: "test",
      title: "Login Screen",
      kind: "screen-spec",
      version: "1.0.0",
      required: true,
      sections: [],
    };

    const filename = generateDocumentFilename(document);

    expect(filename).toMatch(/^Login_Screen_\d{4}-\d{2}-\d{2}\.json$/);
  });
});
