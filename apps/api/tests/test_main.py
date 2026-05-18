import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    """Create a test client for the FastAPI application."""
    return TestClient(app)


class TestHealthEndpoints:
    """Tests for health check endpoints."""

    def test_root_endpoint(self, client):
        """Test root endpoint returns running message."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "SpecForge API is running"

    def test_health_endpoint(self, client):
        """Test health endpoint returns ok status."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["version"] == "0.1.0"


class TestProjectValidation:
    """Tests for project validation endpoint."""

    def test_validate_valid_project(self, client):
        """Test validation of a valid project."""
        project = {
            "id": "project-1",
            "title": "Test Project",
            "documents": [
                {
                    "id": "doc-1",
                    "title": "Test Document",
                    "kind": "screen-spec",
                    "version": "1.0.0",
                    "sections": [],
                }
            ],
        }

        response = client.post("/api/v1/projects/project-1/validate", json=project)
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["score"] == 100
        assert len(data["issues"]) == 0

    def test_validate_project_with_empty_title(self, client):
        """Test validation catches empty project title."""
        project = {
            "id": "project-1",
            "title": "",
            "documents": [],
        }

        response = client.post("/api/v1/projects/project-1/validate", json=project)
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert len(data["issues"]) > 0
        assert any(issue["severity"] == "error" for issue in data["issues"])

    def test_validate_project_with_empty_document_title(self, client):
        """Test validation catches empty document title."""
        project = {
            "id": "project-1",
            "title": "Test Project",
            "documents": [
                {
                    "id": "doc-1",
                    "title": "",
                    "kind": "screen-spec",
                    "version": "1.0.0",
                    "sections": [],
                }
            ],
        }

        response = client.post("/api/v1/projects/project-1/validate", json=project)
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert any("empty" in issue["message"].lower() for issue in data["issues"])

    def test_score_calculation(self, client):
        """Test score calculation with errors."""
        project = {
            "id": "project-1",
            "title": "",  # Error: -20 points
            "documents": [
                {
                    "id": "doc-1",
                    "title": "",  # Error: -20 points
                    "kind": "screen-spec",
                    "version": "1.0.0",
                    "sections": [],
                }
            ],
        }

        response = client.post("/api/v1/projects/project-1/validate", json=project)
        assert response.status_code == 200
        data = response.json()
        # 100 - 20 - 20 = 60
        assert data["score"] == 60


class TestProjectCRUD:
    """Tests for project CRUD endpoints."""

    def test_create_project(self, client):
        """Test creating a new project."""
        project = {
            "id": "project-1",
            "title": "Test Project",
            "documents": [],
        }

        response = client.post("/api/v1/projects", json=project)
        assert response.status_code == 201
        data = response.json()
        assert data["id"] == "project-1"
        assert data["title"] == "Test Project"

    def test_get_project_not_found(self, client):
        """Test getting a non-existent project returns 404."""
        response = client.get("/api/v1/projects/non-existent")
        assert response.status_code == 404

    def test_update_project(self, client):
        """Test updating a project."""
        project = {
            "id": "project-1",
            "title": "Updated Project",
            "documents": [],
        }

        response = client.put("/api/v1/projects/project-1", json=project)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Project"

    def test_update_project_id_mismatch(self, client):
        """Test updating a project with mismatched IDs returns 400."""
        project = {
            "id": "different-id",
            "title": "Updated Project",
            "documents": [],
        }

        response = client.put("/api/v1/projects/project-1", json=project)
        assert response.status_code == 400

    def test_delete_project(self, client):
        """Test deleting a project."""
        response = client.delete("/api/v1/projects/project-1")
        assert response.status_code == 204
