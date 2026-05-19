"""Project repository for database operations."""

from typing import Sequence

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models.project import Project


class ProjectRepository:
    """Repository for Project database operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, project: Project) -> Project:
        """Create a new project."""
        self.session.add(project)
        await self.session.flush()
        await self.session.refresh(project)
        return project

    async def get_by_id(self, project_id: str) -> Project | None:
        """Get a project by ID with documents."""
        query = (
            select(Project)
            .options(selectinload(Project.documents))
            .where(Project.id == project_id)
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_key(self, key: str) -> Project | None:
        """Get a project by key with documents."""
        query = (
            select(Project)
            .options(selectinload(Project.documents))
            .where(Project.key == key)
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100) -> Sequence[Project]:
        """Get all projects with pagination."""
        query = (
            select(Project)
            .options(selectinload(Project.documents))
            .offset(skip)
            .limit(limit)
            .order_by(Project.updated_at.desc())
        )
        result = await self.session.execute(query)
        return result.scalars().all()

    async def update(self, project: Project) -> Project:
        """Update an existing project."""
        await self.session.flush()
        await self.session.refresh(project)
        return project

    async def delete(self, project_id: str) -> bool:
        """Delete a project by ID."""
        query = delete(Project).where(Project.id == project_id)
        result = await self.session.execute(query)
        return result.rowcount > 0

    async def exists(self, project_id: str) -> bool:
        """Check if a project exists."""
        query = select(Project.id).where(Project.id == project_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none() is not None

    async def key_exists(self, key: str, exclude_id: str | None = None) -> bool:
        """Check if a project key already exists."""
        query = select(Project.id).where(Project.key == key)
        if exclude_id:
            query = query.where(Project.id != exclude_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none() is not None
