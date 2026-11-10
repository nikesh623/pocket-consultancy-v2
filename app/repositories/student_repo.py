from datetime import UTC, datetime
from typing import Any

from pymongo import DESCENDING
from pymongo.asynchronous.database import AsyncDatabase

from app.repositories.base import BaseRepository, to_object_id


class StudentRepository(BaseRepository):
    collection_name = "student_profiles"

    def __init__(self, db: AsyncDatabase):
        super().__init__(db)

    async def get_by_user_id(self, user_id: str) -> dict[str, Any] | None:
        return await self.collection.find_one({"user_id": str(user_id)})

    async def upsert_profile(self, user_id: str, profile_data: dict[str, Any]) -> dict[str, Any]:
        now = datetime.now(UTC)
        profile_data["user_id"] = str(user_id)
        profile_data["updated_at"] = now

        result = await self.collection.find_one_and_update(
            {"user_id": str(user_id)},
            {
                "$set": profile_data,
                "$setOnInsert": {"created_at": now},
            },
            upsert=True,
            return_document=True,
        )
        return result

    async def assign_counselor(self, student_id: str, counselor_id: str | None) -> bool:
        obj_id = to_object_id(student_id)
        filter_q = {"_id": obj_id} if obj_id else {"user_id": str(student_id)}
        res = await self.collection.update_one(
            filter_q,
            {"$set": {"assigned_counselor_id": counselor_id, "updated_at": datetime.now(UTC)}},
        )
        return res.modified_count > 0 or res.matched_count > 0

    async def list_assigned_students(self, counselor_id: str) -> list[dict[str, Any]]:
        cursor = self.collection.find({"assigned_counselor_id": str(counselor_id)}).sort(
            [("updated_at", DESCENDING)]
        )
        return await cursor.to_list(length=100)
