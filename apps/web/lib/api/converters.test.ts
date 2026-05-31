import { describe, it, expect } from "vitest";
import {
  apiDocumentToDocument,
  apiDocumentToEditorState,
  apiProjectToProject,
  apiProjectToFullState,
} from "./converters";
import type { ApiDocument, ApiProject } from "./projects";

describe("apiDocumentToDocument", () => {
  it("should convert API document to frontend Document type", () => {
    // Arrange
    const apiDoc: ApiDocument = {
      id: "doc-123",
      project_id: "proj-1",
      title: "Login Screen",
      key: "login-screen",
      kind: "screen-spec",
      version: "1.0.0",
      order: 0,
      content: {},
      description: "Login screen specification",
    };

    // Act
    const result = apiDocumentToDocument(apiDoc);

    // Assert
    expect(result.id).toBe("doc-123");
    expect(result.title).toBe("Login Screen");
    expect(result.key).toBe("login-screen");
    expect(result.kind).toBe("screen-spec");
    expect(result.version).toBe("1.0.0");
    expect(result.required).toBe(true);
    expect(result.sections).toBeDefined();
    expect(result.sections.length).toBeGreaterThan(0);
  });

  it("should reconstruct sections from preset for screen-spec", () => {
    // Arrange
    const apiDoc: ApiDocument = {
      id: "doc-1",
      project_id: "proj-1",
      title: "Test",
      key: "test",
      kind: "screen-spec",
      version: "1.0.0",
      order: 0,
      content: {},
      description: null,
    };

    // Act
    const result = apiDocumentToDocument(apiDoc);

    // Assert
    const sectionKeys = result.sections.map(s => s.key);
    expect(sectionKeys).toContain("overview");
    expect(sectionKeys).toContain("screen-fields");
    expect(sectionKeys).toContain("events");
  });

  it("should reconstruct sections from preset for api-spec", () => {
    // Arrange
    const apiDoc: ApiDocument = {
      id: "doc-1",
      project_id: "proj-1",
      title: "Test API",
      key: "test-api",
      kind: "api-spec",
      version: "1.0.0",
      order: 0,
      content: {},
      description: null,
    };

    // Act
    const result = apiDocumentToDocument(apiDoc);

    // Assert
    expect(result.kind).toBe("api-spec");
    expect(result.sections.length).toBeGreaterThan(0);
  });

  it("should throw error for unknown document kind", () => {
    // Arrange
    const apiDoc: ApiDocument = {
      id: "doc-1",
      project_id: "proj-1",
      title: "Test",
      key: "test",
      kind: "unknown-kind",
      version: "1.0.0",
      order: 0,
      content: {},
      description: null,
    };

    // Act & Assert
    expect(() => apiDocumentToDocument(apiDoc)).toThrow("Unknown document kind");
  });
});

describe("apiDocumentToEditorState", () => {
  it("should convert API document to DocumentEditorState with fieldValues from content", () => {
    // Arrange
    const apiDoc: ApiDocument = {
      id: "doc-1",
      project_id: "proj-1",
      title: "Test Screen",
      key: "test-screen",
      kind: "screen-spec",
      version: "1.0.0",
      order: 0,
      content: {
        "field-purpose": "User authentication",
        "field-main-scenario": "User enters credentials",
      },
      description: null,
    };

    // Act
    const result = apiDocumentToEditorState(apiDoc);

    // Assert
    expect(result.document).toBeDefined();
    expect(result.document.id).toBe("doc-1");
    expect(result.fieldValues).toEqual({
      "field-purpose": "User authentication",
      "field-main-scenario": "User enters credentials",
    });
  });

  it("should handle empty content", () => {
    // Arrange
    const apiDoc: ApiDocument = {
      id: "doc-1",
      project_id: "proj-1",
      title: "Empty Doc",
      key: "empty",
      kind: "screen-spec",
      version: "1.0.0",
      order: 0,
      content: {},
      description: null,
    };

    // Act
    const result = apiDocumentToEditorState(apiDoc);

    // Assert
    expect(result.fieldValues).toEqual({});
  });

  it("should handle null content", () => {
    // Arrange
    const apiDoc: ApiDocument = {
      id: "doc-1",
      project_id: "proj-1",
      title: "Null Content Doc",
      key: "null-content",
      kind: "screen-spec",
      version: "1.0.0",
      order: 0,
      content: null as unknown as Record<string, unknown>,
      description: null,
    };

    // Act
    const result = apiDocumentToEditorState(apiDoc);

    // Assert
    expect(result.fieldValues).toEqual({});
  });
});

describe("apiProjectToProject", () => {
  it("should convert API project to frontend Project type", () => {
    // Arrange
    const apiProject: ApiProject = {
      id: "proj-1",
      title: "My Project",
      key: "my-project",
      description: "A test project",
      documents: [
        {
          id: "doc-1",
          project_id: "proj-1",
          title: "Screen 1",
          key: "screen-1",
          kind: "screen-spec",
          version: "1.0.0",
          order: 0,
          content: {},
          description: null,
        },
      ],
    };

    // Act
    const result = apiProjectToProject(apiProject);

    // Assert
    expect(result.id).toBe("proj-1");
    expect(result.title).toBe("My Project");
    expect(result.key).toBe("my-project");
    expect(result.required).toBe(true);
    expect(result.documents).toHaveLength(1);
    expect(result.documents[0].id).toBe("doc-1");
  });

  it("should sort documents by order", () => {
    // Arrange
    const apiProject: ApiProject = {
      id: "proj-1",
      title: "Project",
      key: "proj",
      description: null,
      documents: [
        { id: "doc-2", project_id: "proj-1", title: "Second", key: "s2", kind: "screen-spec", version: "1.0.0", order: 2, content: {}, description: null },
        { id: "doc-0", project_id: "proj-1", title: "First", key: "s0", kind: "screen-spec", version: "1.0.0", order: 0, content: {}, description: null },
        { id: "doc-1", project_id: "proj-1", title: "Middle", key: "s1", kind: "screen-spec", version: "1.0.0", order: 1, content: {}, description: null },
      ],
    };

    // Act
    const result = apiProjectToProject(apiProject);

    // Assert
    expect(result.documents[0].id).toBe("doc-0");
    expect(result.documents[1].id).toBe("doc-1");
    expect(result.documents[2].id).toBe("doc-2");
  });

  it("should handle empty documents array", () => {
    // Arrange
    const apiProject: ApiProject = {
      id: "proj-1",
      title: "Empty Project",
      key: "empty",
      description: null,
      documents: [],
    };

    // Act
    const result = apiProjectToProject(apiProject);

    // Assert
    expect(result.documents).toEqual([]);
  });
});

describe("apiProjectToFullState", () => {
  it("should return project and documentStates", () => {
    // Arrange
    const apiProject: ApiProject = {
      id: "proj-1",
      title: "Full Project",
      key: "full",
      description: null,
      documents: [
        {
          id: "doc-1",
          project_id: "proj-1",
          title: "Doc 1",
          key: "doc-1",
          kind: "screen-spec",
          version: "1.0.0",
          order: 0,
          content: { "field-1": "value1" },
          description: null,
        },
        {
          id: "doc-2",
          project_id: "proj-1",
          title: "Doc 2",
          key: "doc-2",
          kind: "api-spec",
          version: "1.0.0",
          order: 1,
          content: { "field-2": "value2" },
          description: null,
        },
      ],
    };

    // Act
    const result = apiProjectToFullState(apiProject);

    // Assert
    expect(result.project).toBeDefined();
    expect(result.project.id).toBe("proj-1");
    expect(result.documentStates).toBeDefined();
    expect(Object.keys(result.documentStates)).toHaveLength(2);
    expect(result.documentStates["doc-1"]).toBeDefined();
    expect(result.documentStates["doc-1"].fieldValues).toEqual({ "field-1": "value1" });
    expect(result.documentStates["doc-2"]).toBeDefined();
    expect(result.documentStates["doc-2"].fieldValues).toEqual({ "field-2": "value2" });
  });

  it("should return empty documentStates for project with no documents", () => {
    // Arrange
    const apiProject: ApiProject = {
      id: "proj-1",
      title: "Empty",
      key: "empty",
      description: null,
      documents: [],
    };

    // Act
    const result = apiProjectToFullState(apiProject);

    // Assert
    expect(result.project.documents).toEqual([]);
    expect(result.documentStates).toEqual({});
  });
});
