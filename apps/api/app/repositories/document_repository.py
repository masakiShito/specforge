"""Document repository for database operations."""

from typing import Sequence

from sqlalchemy import select, delete, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.document import Document


class DocumentRepository:
    """Repository for Document database operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, document: Document) -> Document:
        """Create a new document."""
        # Set order to be at the end
        if document.order == 0:
            max_order = await self._get_max_order(document.project_id)
            document.order = max_order + 1

        self.session.add(document)
        await self.session.flush()
        await self.session.refresh(document)
        return document

    async def get_by_id(self, document_id: str) -> Document | None:
        """Get a document by ID."""
        query = select(Document).where(Document.id == document_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_project(
        self, project_id: str, skip: int = 0, limit: int = 100
    ) -> Sequence[Document]:
        """Get all documents for a project."""
        query = (
            select(Document)
            .where(Document.project_id == project_id)
            .offset(skip)
            .limit(limit)
            .order_by(Document.order)
        )
        result = await self.session.execute(query)
        return result.scalars().all()

    async def update(self, document: Document) -> Document:
        """Update an existing document."""
        await self.session.flush()
        await self.session.refresh(document)
        return document

    async def delete(self, document_id: str) -> bool:
        """Delete a document by ID."""
        query = delete(Document).where(Document.id == document_id)
        result = await self.session.execute(query)
        return result.rowcount > 0

    async def reorder(
        self, project_id: str, document_id: str, new_order: int
    ) -> bool:
        """Reorder a document within a project."""
        # Get current document
        document = await self.get_by_id(document_id)
        if not document or document.project_id != project_id:
            return False

        old_order = document.order

        if new_order == old_order:
            return True

        # Shift other documents
        if new_order < old_order:
            # Moving up: increment order of documents between new and old position
            shift_query = (
                update(Document)
                .where(Document.project_id == project_id)
                .where(Document.order >= new_order)
                .where(Document.order < old_order)
                .values(order=Document.order + 1)
            )
        else:
            # Moving down: decrement order of documents between old and new position
            shift_query = (
                update(Document)
                .where(Document.project_id == project_id)
                .where(Document.order > old_order)
                .where(Document.order <= new_order)
                .values(order=Document.order - 1)
            )

        await self.session.execute(shift_query)

        # Update the document's order
        document.order = new_order
        await self.session.flush()

        return True

    async def _get_max_order(self, project_id: str) -> int:
        """Get the maximum order value for documents in a project."""
        query = (
            select(func.max(Document.order))
            .where(Document.project_id == project_id)
        )
        result = await self.session.execute(query)
        max_order = result.scalar_one_or_none()
        return max_order if max_order is not None else -1

    async def exists(self, document_id: str) -> bool:
        """Check if a document exists."""
        query = select(Document.id).where(Document.id == document_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none() is not None
