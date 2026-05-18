import { describe, it, expect } from "vitest";
import { isProject, isDocument, normalizeProjectData, safeNormalizeProjectData } from "./normalize";
import type { Project } from "../core/project";
import type { Document } from "../core/document";

describe("isProject", () => {
  it("should return true for valid project", () => {
    const project: Project = {
      id: "project-1",
      key: "test-project",
      title: "Test Project",
      required: true,
      documents: [],
    };
    expect(isProject(project)).toBe(true);
  });

  it("should return false for document", () => {
    const document: Document = {
      id: "doc-1",
      key: "test-doc",
      title: "Test Document",
      required: true,
      kind: "screen-spec",
      version: "1.0.0",
      sections: [],
    };
    expect(isProject(document)).toBe(false);
  });

  it("should return false for null", () => {
    expect(isProject(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(isProject(undefined)).toBe(false);
  });

  it("should return false for primitive values", () => {
    expect(isProject("string")).toBe(false);
    expect(isProject(123)).toBe(false);
    expect(isProject(true)).toBe(false);
  });
});

describe("isDocument", () => {
  it("should return true for valid document", () => {
    const document: Document = {
      id: "doc-1",
      key: "test-doc",
      title: "Test Document",
      required: true,
      kind: "screen-spec",
      version: "1.0.0",
      sections: [],
    };
    expect(isDocument(document)).toBe(true);
  });

  it("should return false for project", () => {
    const project: Project = {
      id: "project-1",
      key: "test-project",
      title: "Test Project",
      required: true,
      documents: [],
    };
    expect(isDocument(project)).toBe(false);
  });

  it("should return false for null", () => {
    expect(isDocument(null)).toBe(false);
  });
});

describe("normalizeProjectData", () => {
  it("should return project as-is when input is already a project", () => {
    const project: Project = {
      id: "project-1",
      key: "test-project",
      title: "Test Project",
      required: true,
      documents: [],
    };
    const result = normalizeProjectData(project);
    expect(result).toBe(project);
  });

  it("should wrap document in a project when input is a document", () => {
    const document: Document = {
      id: "doc-1",
      key: "test-doc",
      title: "Test Document",
      required: true,
      kind: "screen-spec",
      version: "1.0.0",
      sections: [],
    };
    const result = normalizeProjectData(document);

    expect(result.id).toBe("project-doc-1");
    expect(result.key).toBe("project-test-doc");
    expect(result.title).toBe("Test Document");
    expect(result.documents).toHaveLength(1);
    expect(result.documents[0]).toBe(document);
  });

  it("should preserve all document properties when wrapping", () => {
    const document: Document = {
      id: "doc-1",
      key: "test-doc",
      title: "Test Document",
      required: true,
      kind: "api-spec",
      version: "2.0.0",
      sections: [
        {
          id: "section-1",
          key: "overview",
          title: "Overview",
          required: true,
          fields: [],
        },
      ],
      tags: ["api", "v2"],
    };
    const result = normalizeProjectData(document);

    expect(result.documents[0].kind).toBe("api-spec");
    expect(result.documents[0].version).toBe("2.0.0");
    expect(result.documents[0].sections).toHaveLength(1);
    expect(result.documents[0].tags).toEqual(["api", "v2"]);
  });
});

describe("safeNormalizeProjectData", () => {
  it("should return Ok with project when input is a valid project", () => {
    const project: Project = {
      id: "project-1",
      key: "test-project",
      title: "Test Project",
      required: true,
      documents: [],
    };
    const result = safeNormalizeProjectData(project);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(project);
    }
  });

  it("should return Ok with wrapped project when input is a document", () => {
    const document: Document = {
      id: "doc-1",
      key: "test-doc",
      title: "Test Document",
      required: true,
      kind: "screen-spec",
      version: "1.0.0",
      sections: [],
    };
    const result = safeNormalizeProjectData(document);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe("project-doc-1");
      expect(result.value.documents[0]).toBe(document);
    }
  });

  it("should return Err with NULL_INPUT code for null", () => {
    const result = safeNormalizeProjectData(null);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NULL_INPUT");
    }
  });

  it("should return Err with NULL_INPUT code for undefined", () => {
    const result = safeNormalizeProjectData(undefined);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NULL_INPUT");
    }
  });

  it("should return Err with INVALID_INPUT code for non-object", () => {
    const result = safeNormalizeProjectData("string");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_INPUT");
    }
  });

  it("should return Err with UNKNOWN_TYPE code for invalid object", () => {
    const result = safeNormalizeProjectData({ foo: "bar" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNKNOWN_TYPE");
    }
  });
});
