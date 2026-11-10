from datetime import UTC, datetime
from typing import Any

from pymongo import DESCENDING
from pymongo.asynchronous.database import AsyncDatabase

from app.models.enums import DocumentStatus
from app.repositories.base import BaseRepository


class DocumentRepository(BaseRepository):
    collection_name = "documents"

    def __init__(self, db: AsyncDatabase):
        super().__init__(db)

    async def list_by_student(self, student_id: str) -> list[dict[str, Any]]:
        cursor = self.collection.find({"student_id": str(student_id)}).sort(
            [("created_at", DESCENDING)]
        )
        return await cursor.to_list(length=100)

    async def list_documents(
        self,
        status: DocumentStatus | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        filter_dict: dict[str, Any] = {}
        if status:
            filter_dict["status"] = status.value
        return await self.find_all(
            filter_query=filter_dict,
            sort=[("created_at", DESCENDING)],
            skip=skip,
            limit=limit,
        )

    async def update_review(
        self,
        document_id: str,
        status: DocumentStatus,
        reviewer_id: str,
        feedback: str | None = None,
    ) -> bool:
        now = datetime.now(UTC)
        update_data = {
            "status": status.value,
            "reviewer_id": str(reviewer_id),
            "review_feedback": feedback,
            "reviewed_at": now,
        }
        return await self.update_by_id(document_id, update_data)
