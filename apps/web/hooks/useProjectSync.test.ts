import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useProjectSync } from "./useProjectSync";
import type { ApiProject, ApiDocument } from "../lib/api/projects";

// Mock the API module
vi.mock("../lib/api", () => ({
  getProject: vi.fn(),
  updateProject: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
  apiProjectToFullState: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    code: string;
    constructor(message: string, status: number, code: string = "UNKNOWN") {
      super(message);
      this.status = status;
      this.code = code;
    }
  },
}));

import {
  getProject,
  updateProject,
  createDocument as apiCreateDocument,
  updateDocument as apiUpdateDocument,
  deleteDocument as apiDeleteDocument,
  apiProjectToFullState,
  ApiError,
} from "../lib/api";

const mockGetProject = vi.mocked(getProject);
const mockUpdateProject = vi.mocked(updateProject);
const mockApiCreateDocument = vi.mocked(apiCreateDocument);
const mockApiUpdateDocument = vi.mocked(apiUpdateDocument);
const mockApiDeleteDocument = vi.mocked(apiDeleteDocument);
const mockApiProjectToFullState = vi.mocked(apiProjectToFullState);

// Sample data for tests
const createMockApiProject = (overrides: Partial<ApiProject> = {}): ApiProject => ({
  id: "proj-1",
  title: "Test Project",
  key: "test-proj",
  description: null,
  documents: [],
  ...overrides,
});

const createMockApiDocument = (overrides: Partial<ApiDocument> = {}): ApiDocument => ({
  id: "doc-1",
  project_id: "proj-1",
  title: "Test Doc",
  key: "test-doc",
  kind: "screen-spec",
  version: "1.0.0",
  order: 0,
  content: {},
  description: null,
  ...overrides,
});

describe("useProjectSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial loading", () => {
    it("should start with loading state", () => {
      // Arrange
      mockGetProject.mockImplementation(() => new Promise(() => {})); // Never resolves

      // Act
      const { result } = renderHook(() => useProjectSync({ projectId: "proj-1" }));

      // Assert
      expect(result.current.isLoading).toBe(true);
      expect(result.current.project).toBeNull();
    });

    it("should load project and set state on success", async () => {
      // Arrange
      const apiProject = createMockApiProject({
        documents: [createMockApiDocument()],
      });
      mockGetProject.mockResolvedValue(apiProject);
      mockApiProjectToFullState.mockReturnValue({
        project: {
          id: "proj-1",
          title: "Test Project",
          key: "test-proj",
          required: true,
          documents: [{
            id: "doc-1",
            key: "test-doc",
            title: "Test Doc",
            kind: "screen-spec",
            version: "1.0.0",
            required: true,
            sections: [],
          }],
        },
        documentStates: {
          "doc-1": {
            document: {
              id: "doc-1",
              key: "test-doc",
              title: "Test Doc",
              kind: "screen-spec",
              version: "1.0.0",
              required: true,
              sections: [],
            },
            fieldValues: {},
          },
        },
      });

      // Act
      const { result } = renderHook(() => useProjectSync({ projectId: "proj-1" }));

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.project).not.toBeNull();
      expect(result.current.project?.id).toBe("proj-1");
      expect(result.current.error).toBeNull();
    });

    it("should set error state on API failure", async () => {
      // Arrange
      mockGetProject.mockRejectedValue(new ApiError("Not found", 404, "NOT_FOUND"));

      // Act
      const { result } = renderHook(() => useProjectSync({ projectId: "proj-1" }));

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.error).toBe("Not found");
      expect(result.current.project).toBeNull();
    });
  });

  describe("handleProjectTitleChangeWithSync", () => {
    it("should update project title locally and sync to API", async () => {
      // Arrange
      const apiProject = createMockApiProject();
      mockGetProject.mockResolvedValue(apiProject);
      mockApiProjectToFullState.mockReturnValue({
        project: {
          id: "proj-1",
          title: "Test Project",
          key: "test-proj",
          required: true,
          documents: [],
        },
        documentStates: {},
      });
      mockUpdateProject.mockResolvedValue({ ...apiProject, title: "New Title" });

      const { result } = renderHook(() => useProjectSync({ projectId: "proj-1" }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Act
      await act(async () => {
        await result.current.handleProjectTitleChangeWithSync("New Title");
      });

      // Assert
      expect(mockUpdateProject).toHaveBeenCalledWith("proj-1", { title: "New Title" });
      expect(result.current.project?.title).toBe("New Title");
    });

    it("should not update title if empty", async () => {
      // Arrange
      const apiProject = createMockApiProject();
      mockGetProject.mockResolvedValue(apiProject);
      mockApiProjectToFullState.mockReturnValue({
        project: {
          id: "proj-1",
          title: "Test Project",
          key: "test-proj",
          required: true,
          documents: [],
        },
        documentStates: {},
      });

      const { result } = renderHook(() => useProjectSync({ projectId: "proj-1" }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Act
      await act(async () => {
        await result.current.handleProjectTitleChangeWithSync("   ");
      });

      // Assert
      expect(mockUpdateProject).not.toHaveBeenCalled();
    });
  });

  describe("handleFieldValueChangeWithSync", () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should update field value locally immediately", async () => {
      // Arrange
      const apiProject = createMockApiProject({
        documents: [createMockApiDocument()],
      });
      mockGetProject.mockResolvedValue(apiProject);
      mockApiProjectToFullState.mockReturnValue({
        project: {
          id: "proj-1",
          title: "Test Project",
          key: "test-proj",
          required: true,
          documents: [{
            id: "doc-1",
            key: "test-doc",
            title: "Test Doc",
            kind: "screen-spec",
            version: "1.0.0",
            required: true,
            sections: [{
              id: "sec-1",
              key: "overview",
              title: "Overview",
              required: true,
              fields: [{
                id: "field-1",
                key: "purpose",
                label: "Purpose",
                required: true,
                valueType: "text",
              }],
            }],
          }],
        },
        documentStates: {
          "doc-1": {
            document: {
              id: "doc-1",
              key: "test-doc",
              title: "Test Doc",
              kind: "screen-spec",
              version: "1.0.0",
              required: true,
              sections: [{
                id: "sec-1",
                key: "overview",
                title: "Overview",
                required: true,
                fields: [{
                  id: "field-1",
                  key: "purpose",
                  label: "Purpose",
                  required: true,
                  valueType: "text",
                }],
              }],
            },
            fieldValues: { "field-1": "" },
          },
        },
      });

      const { result } = renderHook(() => useProjectSync({ projectId: "proj-1" }));

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Act
      act(() => {
        result.current.handleFieldValueChangeWithSync("doc-1", "field-1", "New value");
      });

      // Assert - local state updated immediately
      expect(result.current.documentStates["doc-1"].fieldValues["field-1"]).toBe("New value");
    });

    it("should debounce API calls", async () => {
      // Arrange
      const apiProject = createMockApiProject({
        documents: [createMockApiDocument()],
      });
      mockGetProject.mockResolvedValue(apiProject);
      mockApiProjectToFullState.mockReturnValue({
        project: {
          id: "proj-1",
          title: "Test Project",
          key: "test-proj",
          required: true,
          documents: [{
            id: "doc-1",
            key: "test-doc",
            title: "Test Doc",
            kind: "screen-spec",
            version: "1.0.0",
            required: true,
            sections: [],
          }],
        },
        documentStates: {
          "doc-1": {
            document: {
              id: "doc-1",
              key: "test-doc",
              title: "Test Doc",
              kind: "screen-spec",
              version: "1.0.0",
              required: true,
              sections: [],
            },
            fieldValues: {},
          },
        },
      });
      mockApiUpdateDocument.mockResolvedValue(createMockApiDocument());

      const { result } = renderHook(() => useProjectSync({ projectId: "proj-1" }));

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Act - multiple rapid updates
      act(() => {
        result.current.handleFieldValueChangeWithSync("doc-1", "field-1", "Value 1");
        result.current.handleFieldValueChangeWithSync("doc-1", "field-1", "Value 2");
        result.current.handleFieldValueChangeWithSync("doc-1", "field-1", "Value 3");
      });

      // Assert - no API call yet (debounced)
      expect(mockApiUpdateDocument).not.toHaveBeenCalled();

      // Act - advance timer past debounce delay
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      // Assert - only one API call after debounce
      expect(mockApiUpdateDocument).toHaveBeenCalledTimes(1);
      expect(mockApiUpdateDocument).toHaveBeenCalledWith("doc-1", {
        content: { "field-1": "Value 3" },
      });
    });

    it("should flush the latest document state after multiple debounced field updates", async () => {
      // Arrange
      const apiProject = createMockApiProject({
        documents: [createMockApiDocument()],
      });
      mockGetProject.mockResolvedValue(apiProject);
      mockApiProjectToFullState.mockReturnValue({
        project: {
          id: "proj-1",
          title: "Test Project",
          key: "test-proj",
          required: true,
          documents: [{
            id: "doc-1",
            key: "test-doc",
            title: "Test Doc",
            kind: "screen-spec",
            version: "1.0.0",
            required: true,
            sections: [{
              id: "sec-1",
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
                  key: "notes",
                  label: "Notes",
                  required: false,
                  valueType: "text",
                },
              ],
            }],
          }],
        },
        documentStates: {
          "doc-1": {
            document: {
              id: "doc-1",
              key: "test-doc",
              title: "Test Doc",
              kind: "screen-spec",
              version: "1.0.0",
              required: true,
              sections: [{
                id: "sec-1",
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
                    key: "notes",
                    label: "Notes",
                    required: false,
                    valueType: "text",
                  },
                ],
              }],
            },
            fieldValues: {
              "field-1": "Initial 1",
              "field-2": "Initial 2",
            },
          },
        },
      });
      mockApiUpdateDocument.mockResolvedValue(createMockApiDocument());

      const { result } = renderHook(() => useProjectSync({ projectId: "proj-1" }));

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Act - update different fields before the debounce timer flushes.
      act(() => {
        result.current.handleFieldValueChangeWithSync("doc-1", "field-1", "Latest 1");
      });

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      act(() => {
        result.current.handleFieldValueChangeWithSync("doc-1", "field-2", "Latest 2");
      });

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      // Assert - flushed content includes the latest full state, not the state
      // captured when the debounced callback was created.
      expect(mockApiUpdateDocument).toHaveBeenCalledTimes(1);
      expect(mockApiUpdateDocument).toHaveBeenCalledWith("doc-1", {
        content: {
          "field-1": "Latest 1",
          "field-2": "Latest 2",
        },
      });
    });
  });

  describe("handleDeleteDocumentWithSync", () => {
    it("should delete document and update local state", async () => {
      // Arrange
      const apiProject = createMockApiProject({
        documents: [
          createMockApiDocument({ id: "doc-1" }),
          createMockApiDocument({ id: "doc-2", order: 1 }),
        ],
      });
      mockGetProject.mockResolvedValue(apiProject);
      mockApiProjectToFullState.mockReturnValue({
        project: {
          id: "proj-1",
          title: "Test Project",
          key: "test-proj",
          required: true,
          documents: [
            { id: "doc-1", key: "d1", title: "Doc 1", kind: "screen-spec", version: "1.0.0", required: true, sections: [] },
            { id: "doc-2", key: "d2", title: "Doc 2", kind: "screen-spec", version: "1.0.0", required: true, sections: [] },
          ],
        },
        documentStates: {
          "doc-1": { document: {} as any, fieldValues: {} },
          "doc-2": { document: {} as any, fieldValues: {} },
        },
      });
      mockApiDeleteDocument.mockResolvedValue(undefined);

      const { result } = renderHook(() => useProjectSync({ projectId: "proj-1" }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Act
      await act(async () => {
        await result.current.handleDeleteDocumentWithSync("doc-1");
      });

      // Assert
      expect(mockApiDeleteDocument).toHaveBeenCalledWith("doc-1");
      expect(result.current.project?.documents).toHaveLength(1);
      expect(result.current.project?.documents[0].id).toBe("doc-2");
    });

    it("should not delete if only one document remains", async () => {
      // Arrange
      const apiProject = createMockApiProject({
        documents: [createMockApiDocument()],
      });
      mockGetProject.mockResolvedValue(apiProject);
      mockApiProjectToFullState.mockReturnValue({
        project: {
          id: "proj-1",
          title: "Test Project",
          key: "test-proj",
          required: true,
          documents: [
            { id: "doc-1", key: "d1", title: "Doc 1", kind: "screen-spec", version: "1.0.0", required: true, sections: [] },
          ],
        },
        documentStates: {
          "doc-1": { document: {} as any, fieldValues: {} },
        },
      });

      const { result } = renderHook(() => useProjectSync({ projectId: "proj-1" }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Act
      await act(async () => {
        await result.current.handleDeleteDocumentWithSync("doc-1");
      });

      // Assert
      expect(mockApiDeleteDocument).not.toHaveBeenCalled();
      expect(result.current.project?.documents).toHaveLength(1);
    });
  });

  describe("clearError", () => {
    it("should clear error state", async () => {
      // Arrange
      mockGetProject.mockRejectedValue(new ApiError("Error", 500));

      const { result } = renderHook(() => useProjectSync({ projectId: "proj-1" }));

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Act
      act(() => {
        result.current.clearError();
      });

      // Assert
      expect(result.current.error).toBeNull();
    });
  });
});
