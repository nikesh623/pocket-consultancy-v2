from typing import Any

from pymongo import DESCENDING
from pymongo.asynchronous.database import AsyncDatabase

from app.repositories.base import BaseRepository


class CounselorNoteRepository(BaseRepository):
    collection_name = "counselor_notes"

    def __init__(self, db: AsyncDatabase):
        super().__init__(db)

    async def list_by_student(self, student_id: str, counselor_id: str) -> list[dict[str, Any]]:
        cursor = self.collection.find(
            {"student_id": str(student_id), "counselor_id": str(counselor_id)}
        ).sort([("created_at", DESCENDING)])
        return await cursor.to_list(length=100)
