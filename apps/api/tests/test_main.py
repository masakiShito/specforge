"""Tests for main API endpoints."""

import pytest
from httpx import AsyncClient


class TestHealthEndpoints:
    """Tests for health check endpoints."""

    @pytest.mark.asyncio
    async def test_root_endpoint(self, client: AsyncClient):
        """Test root endpoint returns running message."""
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "SpecForge API is running"

    @pytest.mark.asyncio
    async def test_health_endpoint(self, client: AsyncClient):
        """Test health endpoint returns ok status."""
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["version"] == "0.1.0"


class TestProjectCRUD:
    """Tests for project CRUD endpoints."""

    @pytest.mark.asyncio
    async def test_list_projects_empty(self, client: AsyncClient):
        """Test listing projects when database is empty."""
        response = await client.get("/api/v1/projects")
        assert response.status_code == 200
        data = response.json()
        assert data == []

    @pytest.mark.asyncio
    async def test_create_project(self, client: AsyncClient):
        """Test creating a new project."""
        project_data = {
            "title": "Test Project",
            "key": "test-project",
            "description": "A test project",
        }

        response = await client.post("/api/v1/projects", json=project_data)
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Test Project"
        assert data["key"] == "test-project"
        assert "id" in data

    @pytest.mark.asyncio
    async def test_create_project_duplicate_key(self, client: AsyncClient):
        """Test creating a project with duplicate key returns 409."""
        project_data = {
            "title": "Test Project",
            "key": "duplicate-key",
        }

        response = await client.post("/api/v1/projects", json=project_data)
        assert response.status_code == 201

        response = await client.post("/api/v1/projects", json=project_data)
        assert response.status_code == 409

    @pytest.mark.asyncio
    async def test_get_project(self, client: AsyncClient):
        """Test getting a project by ID."""
        project_data = {
            "title": "Test Project",
            "key": "get-project-test",
        }
        create_response = await client.post("/api/v1/projects", json=project_data)
        project_id = create_response.json()["id"]

        response = await client.get(f"/api/v1/projects/{project_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == project_id
        assert data["title"] == "Test Project"

    @pytest.mark.asyncio
    async def test_get_project_not_found(self, client: AsyncClient):
        """Test getting a non-existent project returns 404."""
        response = await client.get("/api/v1/projects/non-existent-id")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_project(self, client: AsyncClient):
        """Test updating a project."""
        project_data = {
            "title": "Original Title",
            "key": "update-test",
        }
        create_response = await client.post("/api/v1/projects", json=project_data)
        project_id = create_response.json()["id"]

        update_data = {"title": "Updated Title"}
        response = await client.put(f"/api/v1/projects/{project_id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"

    @pytest.mark.asyncio
    async def test_delete_project(self, client: AsyncClient):
        """Test deleting a project."""
        project_data = {
            "title": "To Delete",
            "key": "delete-test",
        }
        create_response = await client.post("/api/v1/projects", json=project_data)
        project_id = create_response.json()["id"]

        response = await client.delete(f"/api/v1/projects/{project_id}")
        assert response.status_code == 204

        response = await client.get(f"/api/v1/projects/{project_id}")
        assert response.status_code == 404


class TestDocumentCRUD:
    """Tests for document CRUD endpoints."""

    @pytest.mark.asyncio
    async def test_create_document(self, client: AsyncClient):
        """Test creating a document in a project."""
        project_data = {"title": "Test Project", "key": "doc-test-project"}
        create_response = await client.post("/api/v1/projects", json=project_data)
        project_id = create_response.json()["id"]

        doc_data = {
            "title": "Test Document",
            "key": "test-doc",
            "kind": "screen-spec",
            "content": {"sections": []},
        }
        response = await client.post(
            f"/api/v1/projects/{project_id}/documents", json=doc_data
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Test Document"
        assert data["kind"] == "screen-spec"

    @pytest.mark.asyncio
    async def test_list_documents(self, client: AsyncClient):
        """Test listing documents in a project."""
        project_data = {"title": "Test Project", "key": "list-docs-project"}
        create_response = await client.post("/api/v1/projects", json=project_data)
        project_id = create_response.json()["id"]

        doc_data = {"title": "Document 1", "key": "doc-1", "kind": "screen-spec"}
        await client.post(f"/api/v1/projects/{project_id}/documents", json=doc_data)

        response = await client.get(f"/api/v1/projects/{project_id}/documents")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["title"] == "Document 1"

    @pytest.mark.asyncio
    async def test_get_document(self, client: AsyncClient):
        """Test getting a document by ID."""
        project_data = {"title": "Test Project", "key": "get-doc-project"}
        create_response = await client.post("/api/v1/projects", json=project_data)
        project_id = create_response.json()["id"]

        doc_data = {"title": "Test Document", "key": "get-doc", "kind": "api-spec"}
        doc_response = await client.post(
            f"/api/v1/projects/{project_id}/documents", json=doc_data
        )
        doc_id = doc_response.json()["id"]

        response = await client.get(f"/api/v1/documents/{doc_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == doc_id
        assert data["kind"] == "api-spec"

    @pytest.mark.asyncio
    async def test_update_document(self, client: AsyncClient):
        """Test updating a document."""
        project_data = {"title": "Test Project", "key": "update-doc-project"}
        create_response = await client.post("/api/v1/projects", json=project_data)
        project_id = create_response.json()["id"]

        doc_data = {"title": "Original", "key": "update-doc", "kind": "screen-spec"}
        doc_response = await client.post(
            f"/api/v1/projects/{project_id}/documents", json=doc_data
        )
        doc_id = doc_response.json()["id"]

        update_data = {"title": "Updated"}
        response = await client.put(f"/api/v1/documents/{doc_id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated"

    @pytest.mark.asyncio
    async def test_delete_document(self, client: AsyncClient):
        """Test deleting a document."""
        project_data = {"title": "Test Project", "key": "delete-doc-project"}
        create_response = await client.post("/api/v1/projects", json=project_data)
        project_id = create_response.json()["id"]

        doc_data = {"title": "To Delete", "key": "delete-doc", "kind": "screen-spec"}
        doc_response = await client.post(
            f"/api/v1/projects/{project_id}/documents", json=doc_data
        )
        doc_id = doc_response.json()["id"]

        response = await client.delete(f"/api/v1/documents/{doc_id}")
        assert response.status_code == 204

        response = await client.get(f"/api/v1/documents/{doc_id}")
        assert response.status_code == 404


class TestProjectValidation:
    """Tests for project validation endpoint."""

    @pytest.mark.asyncio
    async def test_validate_valid_project(self, client: AsyncClient):
        """Test validation of a valid project."""
        project_data = {"title": "Valid Project", "key": "valid-project"}
        create_response = await client.post("/api/v1/projects", json=project_data)
        project_id = create_response.json()["id"]

        response = await client.post(f"/api/v1/projects/{project_id}/validate")
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["score"] == 100

    @pytest.mark.asyncio
    async def test_validate_nonexistent_project(self, client: AsyncClient):
        """Test validation of non-existent project returns 404."""
        response = await client.post("/api/v1/projects/non-existent/validate")
        assert response.status_code == 404
