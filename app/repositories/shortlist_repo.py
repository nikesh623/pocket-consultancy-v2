from datetime import UTC, datetime
from typing import Any

from pymongo import DESCENDING
from pymongo.asynchronous.database import AsyncDatabase

from app.repositories.base import BaseRepository


class ShortlistRepository(BaseRepository):
    collection_name = "shortlists"

    def __init__(self, db: AsyncDatabase):
        super().__init__(db)

    async def add(self, student_id: str, course_id: str) -> dict[str, Any]:
        doc = {
            "student_id": str(student_id),
            "course_id": str(course_id),
            "created_at": datetime.now(UTC),
        }
        res = await self.collection.find_one_and_update(
            {"student_id": str(student_id), "course_id": str(course_id)},
            {"$setOnInsert": doc},
            upsert=True,
            return_document=True,
        )
        return res

    async def remove(self, student_id: str, course_id: str) -> bool:
        res = await self.collection.delete_one(
            {"student_id": str(student_id), "course_id": str(course_id)}
        )
        return res.deleted_count > 0

    async def list_by_student(self, student_id: str) -> list[dict[str, Any]]:
        cursor = self.collection.find({"student_id": str(student_id)}).sort(
            [("created_at", DESCENDING)]
        )
        return await cursor.to_list(length=100)

    async def exists(self, student_id: str, course_id: str) -> bool:
        doc = await self.collection.find_one(
            {"student_id": str(student_id), "course_id": str(course_id)}
        )
        return doc is not None
