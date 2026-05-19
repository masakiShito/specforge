"""SpecForge API - Schema-driven design document editor backend."""

import os
from contextlib import asynccontextmanager
from typing import Any
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, status, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from .db import get_db, init_db, close_db
from .models import Project, Document
from .repositories import ProjectRepository, DocumentRepository


# Load environment variables
load_dotenv()


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
    try:
        await init_db()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Warning: Could not initialize database: {e}")
        print("Running without database persistence")
    yield
    # Shutdown
    print("SpecForge API shutting down...")
    await close_db()


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
# Request/Response Models
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


class DocumentCreate(BaseModel):
    """Request model for creating a document."""
    title: str = Field(..., description="Document title")
    key: str = Field(..., description="Document key")
    kind: str = Field(..., description="Document kind (screen-spec, api-spec, etc.)")
    version: str = Field(default="1.0.0", description="Document version")
    content: dict[str, Any] = Field(default_factory=dict, description="Document content")
    description: str | None = Field(None, description="Document description")


class DocumentUpdate(BaseModel):
    """Request model for updating a document."""
    title: str | None = Field(None, description="Document title")
    key: str | None = Field(None, description="Document key")
    version: str | None = Field(None, description="Document version")
    content: dict[str, Any] | None = Field(None, description="Document content")
    description: str | None = Field(None, description="Document description")


class DocumentResponse(BaseModel):
    """Response model for a document."""
    id: str = Field(..., description="Document identifier")
    project_id: str = Field(..., description="Project identifier")
    title: str = Field(..., description="Document title")
    key: str = Field(..., description="Document key")
    kind: str = Field(..., description="Document kind")
    version: str = Field(..., description="Document version")
    order: int = Field(..., description="Order within project")
    content: dict[str, Any] = Field(..., description="Document content")
    description: str | None = Field(None, description="Document description")

    class Config:
        from_attributes = True


class DocumentReorder(BaseModel):
    """Request model for reordering a document."""
    new_order: int = Field(..., description="New order position")


class ProjectCreate(BaseModel):
    """Request model for creating a project."""
    title: str = Field(..., description="Project title")
    key: str = Field(..., description="Project key (unique identifier)")
    description: str | None = Field(None, description="Project description")


class ProjectUpdate(BaseModel):
    """Request model for updating a project."""
    title: str | None = Field(None, description="Project title")
    description: str | None = Field(None, description="Project description")


class ProjectResponse(BaseModel):
    """Response model for a project."""
    id: str = Field(..., description="Project identifier")
    title: str = Field(..., description="Project title")
    key: str = Field(..., description="Project key")
    description: str | None = Field(None, description="Project description")
    documents: list[DocumentResponse] = Field(default_factory=list, description="Documents")

    class Config:
        from_attributes = True


class ProjectListItem(BaseModel):
    """List item model for projects (without documents)."""
    id: str = Field(..., description="Project identifier")
    title: str = Field(..., description="Project title")
    key: str = Field(..., description="Project key")
    description: str | None = Field(None, description="Project description")
    document_count: int = Field(..., description="Number of documents")

    class Config:
        from_attributes = True


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
# Helper Functions
# ---------------------------------------------------------------------------

def project_to_response(project: Project) -> ProjectResponse:
    """Convert a Project model to ProjectResponse."""
    return ProjectResponse(
        id=project.id,
        title=project.title,
        key=project.key,
        description=project.description,
        documents=[
            DocumentResponse(
                id=doc.id,
                project_id=doc.project_id,
                title=doc.title,
                key=doc.key,
                kind=doc.kind,
                version=doc.version,
                order=doc.order,
                content=doc.content,
                description=doc.description,
            )
            for doc in sorted(project.documents, key=lambda d: d.order)
        ],
    )


def project_to_list_item(project: Project) -> ProjectListItem:
    """Convert a Project model to ProjectListItem."""
    return ProjectListItem(
        id=project.id,
        title=project.title,
        key=project.key,
        description=project.description,
        document_count=len(project.documents),
    )


def document_to_response(document: Document) -> DocumentResponse:
    """Convert a Document model to DocumentResponse."""
    return DocumentResponse(
        id=document.id,
        project_id=document.project_id,
        title=document.title,
        key=document.key,
        kind=document.kind,
        version=document.version,
        order=document.order,
        content=document.content,
        description=document.description,
    )


# ---------------------------------------------------------------------------
# Routes: Health & Root
# ---------------------------------------------------------------------------

@app.get("/", response_model=MessageResponse)
def read_root() -> MessageResponse:
    """Root endpoint returning API status message."""
    return MessageResponse(message="SpecForge API is running")


@app.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    """Health check endpoint for monitoring."""
    return HealthResponse(status="ok", version="0.1.0")


# ---------------------------------------------------------------------------
# Routes: Projects
# ---------------------------------------------------------------------------

@app.get("/api/v1/projects", response_model=list[ProjectListItem])
async def list_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
) -> list[ProjectListItem]:
    """List all projects."""
    repo = ProjectRepository(db)
    projects = await repo.get_all(skip=skip, limit=limit)
    return [project_to_list_item(p) for p in projects]


@app.post("/api/v1/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    """Create a new project."""
    repo = ProjectRepository(db)

    # Check if key already exists
    if await repo.key_exists(project_data.key):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Project with key '{project_data.key}' already exists",
        )

    project = Project(
        id=str(uuid4()),
        title=project_data.title,
        key=project_data.key,
        description=project_data.description,
    )
    project = await repo.create(project)
    return project_to_response(project)


@app.get("/api/v1/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    """Get a project by ID."""
    repo = ProjectRepository(db)
    project = await repo.get_by_id(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{project_id}' not found",
        )
    return project_to_response(project)


@app.put("/api/v1/projects/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_data: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    """Update an existing project."""
    repo = ProjectRepository(db)
    project = await repo.get_by_id(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{project_id}' not found",
        )

    if project_data.title is not None:
        project.title = project_data.title
    if project_data.description is not None:
        project.description = project_data.description

    project = await repo.update(project)
    return project_to_response(project)


@app.delete("/api/v1/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a project by ID."""
    repo = ProjectRepository(db)
    deleted = await repo.delete(project_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{project_id}' not found",
        )


# ---------------------------------------------------------------------------
# Routes: Documents
# ---------------------------------------------------------------------------

@app.get("/api/v1/projects/{project_id}/documents", response_model=list[DocumentResponse])
async def list_documents(
    project_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
) -> list[DocumentResponse]:
    """List all documents in a project."""
    project_repo = ProjectRepository(db)
    if not await project_repo.exists(project_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{project_id}' not found",
        )

    doc_repo = DocumentRepository(db)
    documents = await doc_repo.get_by_project(project_id, skip=skip, limit=limit)
    return [document_to_response(d) for d in documents]


@app.post(
    "/api/v1/projects/{project_id}/documents",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_document(
    project_id: str,
    document_data: DocumentCreate,
    db: AsyncSession = Depends(get_db),
) -> DocumentResponse:
    """Create a new document in a project."""
    project_repo = ProjectRepository(db)
    if not await project_repo.exists(project_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{project_id}' not found",
        )

    doc_repo = DocumentRepository(db)
    document = Document(
        id=str(uuid4()),
        project_id=project_id,
        title=document_data.title,
        key=document_data.key,
        kind=document_data.kind,
        version=document_data.version,
        content=document_data.content,
        description=document_data.description,
    )
    document = await doc_repo.create(document)
    return document_to_response(document)


@app.get("/api/v1/documents/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
) -> DocumentResponse:
    """Get a document by ID."""
    doc_repo = DocumentRepository(db)
    document = await doc_repo.get_by_id(document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{document_id}' not found",
        )
    return document_to_response(document)


@app.put("/api/v1/documents/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: str,
    document_data: DocumentUpdate,
    db: AsyncSession = Depends(get_db),
) -> DocumentResponse:
    """Update an existing document."""
    doc_repo = DocumentRepository(db)
    document = await doc_repo.get_by_id(document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{document_id}' not found",
        )

    if document_data.title is not None:
        document.title = document_data.title
    if document_data.key is not None:
        document.key = document_data.key
    if document_data.version is not None:
        document.version = document_data.version
    if document_data.content is not None:
        document.content = document_data.content
    if document_data.description is not None:
        document.description = document_data.description

    document = await doc_repo.update(document)
    return document_to_response(document)


@app.delete("/api/v1/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a document by ID."""
    doc_repo = DocumentRepository(db)
    deleted = await doc_repo.delete(document_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{document_id}' not found",
        )


@app.patch(
    "/api/v1/projects/{project_id}/documents/{document_id}/reorder",
    response_model=DocumentResponse,
)
async def reorder_document(
    project_id: str,
    document_id: str,
    reorder_data: DocumentReorder,
    db: AsyncSession = Depends(get_db),
) -> DocumentResponse:
    """Reorder a document within a project."""
    doc_repo = DocumentRepository(db)

    success = await doc_repo.reorder(project_id, document_id, reorder_data.new_order)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{document_id}' not found in project '{project_id}'",
        )

    document = await doc_repo.get_by_id(document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{document_id}' not found",
        )
    return document_to_response(document)


# ---------------------------------------------------------------------------
# Routes: Validation
# ---------------------------------------------------------------------------

@app.post("/api/v1/projects/{project_id}/validate", response_model=ValidationResult)
async def validate_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
) -> ValidationResult:
    """
    Validate a project and return validation results.

    This endpoint performs validation on the project and
    returns any issues found along with a quality score.
    """
    repo = ProjectRepository(db)
    project = await repo.get_by_id(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{project_id}' not found",
        )

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
                    message=f"Document '{doc.key}' has an empty title",
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
