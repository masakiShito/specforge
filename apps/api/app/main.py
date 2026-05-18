import os
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

class Settings:
    """Application settings loaded from environment variables."""

    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    @classmethod
    def get_cors_origins(cls) -> list[str]:
        """Get CORS origins from environment or use defaults."""
        env_origins = os.getenv("CORS_ORIGINS", "")
        if env_origins:
            return [origin.strip() for origin in env_origins.split(",")]
        return cls.CORS_ORIGINS


settings = Settings()


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown events."""
    # Startup
    print("SpecForge API starting up...")
    yield
    # Shutdown
    print("SpecForge API shutting down...")


# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="SpecForge API",
    description="API for SpecForge - Schema-driven design document editor",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    """Health check response model."""
    status: str = Field(..., description="Health status")
    version: str = Field(..., description="API version")


class MessageResponse(BaseModel):
    """Generic message response model."""
    message: str = Field(..., description="Response message")


class FieldValue(BaseModel):
    """Field value in a document."""
    field_id: str = Field(..., description="Field identifier")
    value: Any = Field(None, description="Field value")


class SectionData(BaseModel):
    """Section data in a document."""
    section_id: str = Field(..., description="Section identifier")
    fields: list[FieldValue] = Field(default_factory=list, description="Field values")


class DocumentData(BaseModel):
    """Document data for save/load operations."""
    id: str = Field(..., description="Document identifier")
    title: str = Field(..., description="Document title")
    kind: str = Field(..., description="Document kind (screen-spec, api-spec, etc.)")
    version: str = Field(default="1.0.0", description="Document version")
    sections: list[SectionData] = Field(default_factory=list, description="Section data")


class ProjectData(BaseModel):
    """Project data containing multiple documents."""
    id: str = Field(..., description="Project identifier")
    title: str = Field(..., description="Project title")
    documents: list[DocumentData] = Field(default_factory=list, description="Documents")


class ValidationIssue(BaseModel):
    """Validation issue item."""
    id: str = Field(..., description="Issue identifier")
    severity: str = Field(..., description="Severity level (error, warning, info)")
    document_id: str = Field(..., description="Document identifier")
    section_id: str = Field(..., description="Section identifier")
    field_id: str = Field(..., description="Field identifier")
    message: str = Field(..., description="Issue message")


class ValidationResult(BaseModel):
    """Validation result response."""
    valid: bool = Field(..., description="Whether the document is valid")
    issues: list[ValidationIssue] = Field(default_factory=list, description="Validation issues")
    score: int = Field(default=100, description="Quality score (0-100)")


class ErrorResponse(BaseModel):
    """Error response model."""
    detail: str = Field(..., description="Error detail message")
    code: str = Field(default="UNKNOWN_ERROR", description="Error code")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/", response_model=MessageResponse)
def read_root() -> MessageResponse:
    """Root endpoint returning API status message."""
    return MessageResponse(message="SpecForge API is running")


@app.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    """Health check endpoint for monitoring."""
    return HealthResponse(status="ok", version="0.1.0")


@app.post("/api/v1/projects/{project_id}/validate", response_model=ValidationResult)
def validate_project(project_id: str, project: ProjectData) -> ValidationResult:
    """
    Validate a project and return validation results.

    This endpoint performs validation on the provided project data and
    returns any issues found along with a quality score.
    """
    issues: list[ValidationIssue] = []

    # Basic validation: check for empty titles
    if not project.title.strip():
        issues.append(
            ValidationIssue(
                id=f"{project_id}:title:empty",
                severity="error",
                document_id=project_id,
                section_id="",
                field_id="title",
                message="Project title is empty",
            )
        )

    # Validate each document
    for doc in project.documents:
        if not doc.title.strip():
            issues.append(
                ValidationIssue(
                    id=f"{doc.id}:title:empty",
                    severity="error",
                    document_id=doc.id,
                    section_id="",
                    field_id="title",
                    message=f"Document '{doc.id}' has an empty title",
                )
            )

    # Calculate score (simple penalty-based calculation)
    error_count = sum(1 for issue in issues if issue.severity == "error")
    warning_count = sum(1 for issue in issues if issue.severity == "warning")
    score = max(0, 100 - (error_count * 20) - (warning_count * 5))

    return ValidationResult(
        valid=error_count == 0,
        issues=issues,
        score=score,
    )


@app.post("/api/v1/projects", response_model=ProjectData, status_code=status.HTTP_201_CREATED)
def create_project(project: ProjectData) -> ProjectData:
    """
    Create a new project.

    Note: This is a placeholder endpoint. In production, this would
    persist the project to a database.
    """
    # TODO: Implement database persistence
    return project


@app.get("/api/v1/projects/{project_id}", response_model=ProjectData)
def get_project(project_id: str) -> ProjectData:
    """
    Get a project by ID.

    Note: This is a placeholder endpoint. In production, this would
    retrieve the project from a database.
    """
    # TODO: Implement database retrieval
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Project '{project_id}' not found",
    )


@app.put("/api/v1/projects/{project_id}", response_model=ProjectData)
def update_project(project_id: str, project: ProjectData) -> ProjectData:
    """
    Update an existing project.

    Note: This is a placeholder endpoint. In production, this would
    update the project in a database.
    """
    # TODO: Implement database update
    if project.id != project_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project ID in URL does not match project ID in body",
        )
    return project


@app.delete("/api/v1/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: str) -> None:
    """
    Delete a project by ID.

    Note: This is a placeholder endpoint. In production, this would
    delete the project from a database.
    """
    # TODO: Implement database deletion
    pass
