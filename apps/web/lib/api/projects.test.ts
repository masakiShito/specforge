import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  createDocument,
  updateDocument,
  deleteDocument,
  reorderDocument,
} from "./projects";
import type { ApiProject, ApiProjectListItem, ApiDocument } from "./projects";

// Mock the client module
vi.mock("./client", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "./client";

const mockApiGet = vi.mocked(apiGet);
const mockApiPost = vi.mocked(apiPost);
const mockApiPut = vi.mocked(apiPut);
const mockApiPatch = vi.mocked(apiPatch);
const mockApiDelete = vi.mocked(apiDelete);

describe("Project API functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listProjects", () => {
    it("should call apiGet with correct path and return projects", async () => {
      // Arrange
      const mockProjects: ApiProjectListItem[] = [
        { id: "1", title: "Project 1", key: "proj-1", description: null, document_count: 2 },
        { id: "2", title: "Project 2", key: "proj-2", description: "Desc", document_count: 0 },
      ];
      mockApiGet.mockResolvedValue(mockProjects);

      // Act
      const result = await listProjects();

      // Assert
      expect(mockApiGet).toHaveBeenCalledWith("/api/v1/projects");
      expect(result).toEqual(mockProjects);
    });
  });

  describe("getProject", () => {
    it("should call apiGet with project ID and return project with documents", async () => {
      // Arrange
      const mockProject: ApiProject = {
        id: "project-1",
        title: "Test Project",
        key: "test-proj",
        description: "A test project",
        documents: [
          {
            id: "doc-1",
            project_id: "project-1",
            title: "Doc 1",
            key: "doc-1",
            kind: "screen-spec",
            version: "1.0.0",
            order: 0,
            content: {},
            description: null,
          },
        ],
      };
      mockApiGet.mockResolvedValue(mockProject);

      // Act
      const result = await getProject("project-1");

      // Assert
      expect(mockApiGet).toHaveBeenCalledWith("/api/v1/projects/project-1");
      expect(result).toEqual(mockProject);
    });
  });

  describe("createProject", () => {
    it("should call apiPost with project data and return created project", async () => {
      // Arrange
      const createData = { title: "New Project", key: "new-proj" };
      const mockCreatedProject: ApiProject = {
        id: "new-id",
        title: "New Project",
        key: "new-proj",
        description: null,
        documents: [],
      };
      mockApiPost.mockResolvedValue(mockCreatedProject);

      // Act
      const result = await createProject(createData);

      // Assert
      expect(mockApiPost).toHaveBeenCalledWith("/api/v1/projects", createData);
      expect(result).toEqual(mockCreatedProject);
    });

    it("should include optional description in request", async () => {
      // Arrange
      const createData = { title: "Project", key: "proj", description: "My description" };
      mockApiPost.mockResolvedValue({ ...createData, id: "1", documents: [] });

      // Act
      await createProject(createData);

      // Assert
      expect(mockApiPost).toHaveBeenCalledWith("/api/v1/projects", createData);
    });
  });

  describe("updateProject", () => {
    it("should call apiPut with project ID and update data", async () => {
      // Arrange
      const updateData = { title: "Updated Title" };
      const mockUpdatedProject: ApiProject = {
        id: "project-1",
        title: "Updated Title",
        key: "proj",
        description: null,
        documents: [],
      };
      mockApiPut.mockResolvedValue(mockUpdatedProject);

      // Act
      const result = await updateProject("project-1", updateData);

      // Assert
      expect(mockApiPut).toHaveBeenCalledWith("/api/v1/projects/project-1", updateData);
      expect(result).toEqual(mockUpdatedProject);
    });
  });

  describe("deleteProject", () => {
    it("should call apiDelete with project ID", async () => {
      // Arrange
      mockApiDelete.mockResolvedValue(undefined);

      // Act
      await deleteProject("project-1");

      // Assert
      expect(mockApiDelete).toHaveBeenCalledWith("/api/v1/projects/project-1");
    });
  });
});

describe("Document API functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createDocument", () => {
    it("should call apiPost with project ID and document data", async () => {
      // Arrange
      const projectId = "project-1";
      const documentData = {
        title: "New Doc",
        key: "new-doc",
        kind: "screen-spec",
        version: "1.0.0",
        content: { "field-1": "value" },
      };
      const mockCreatedDoc: ApiDocument = {
        id: "doc-new",
        project_id: projectId,
        title: "New Doc",
        key: "new-doc",
        kind: "screen-spec",
        version: "1.0.0",
        order: 0,
        content: { "field-1": "value" },
        description: null,
      };
      mockApiPost.mockResolvedValue(mockCreatedDoc);

      // Act
      const result = await createDocument(projectId, documentData);

      // Assert
      expect(mockApiPost).toHaveBeenCalledWith(
        `/api/v1/projects/${projectId}/documents`,
        documentData
      );
      expect(result).toEqual(mockCreatedDoc);
    });
  });

  describe("updateDocument", () => {
    it("should call apiPut with document ID and update data", async () => {
      // Arrange
      const documentId = "doc-1";
      const updateData = { title: "Updated Doc", content: { "field-1": "new value" } };
      const mockUpdatedDoc: ApiDocument = {
        id: documentId,
        project_id: "project-1",
        title: "Updated Doc",
        key: "doc-1",
        kind: "screen-spec",
        version: "1.0.0",
        order: 0,
        content: { "field-1": "new value" },
        description: null,
      };
      mockApiPut.mockResolvedValue(mockUpdatedDoc);

      // Act
      const result = await updateDocument(documentId, updateData);

      // Assert
      expect(mockApiPut).toHaveBeenCalledWith(`/api/v1/documents/${documentId}`, updateData);
      expect(result).toEqual(mockUpdatedDoc);
    });
  });

  describe("deleteDocument", () => {
    it("should call apiDelete with document ID", async () => {
      // Arrange
      const documentId = "doc-1";
      mockApiDelete.mockResolvedValue(undefined);

      // Act
      await deleteDocument(documentId);

      // Assert
      expect(mockApiDelete).toHaveBeenCalledWith(`/api/v1/documents/${documentId}`);
    });
  });

  describe("reorderDocument", () => {
    it("should call apiPatch with project ID, document ID, and new order", async () => {
      // Arrange
      const projectId = "project-1";
      const documentId = "doc-1";
      const newOrder = 2;
      const mockReorderedDoc: ApiDocument = {
        id: documentId,
        project_id: projectId,
        title: "Doc 1",
        key: "doc-1",
        kind: "screen-spec",
        version: "1.0.0",
        order: newOrder,
        content: {},
        description: null,
      };
      mockApiPatch.mockResolvedValue(mockReorderedDoc);

      // Act
      const result = await reorderDocument(projectId, documentId, newOrder);

      // Assert
      expect(mockApiPatch).toHaveBeenCalledWith(
        `/api/v1/projects/${projectId}/documents/${documentId}/reorder`,
        { new_order: newOrder }
      );
      expect(result).toEqual(mockReorderedDoc);
    });
  });
});
