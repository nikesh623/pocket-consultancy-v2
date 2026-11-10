from datetime import UTC, datetime
from typing import Any

from pymongo import DESCENDING
from pymongo.asynchronous.collection import AsyncCollection
from pymongo.asynchronous.database import AsyncDatabase

from app.models.enums import ApplicationStatus
from app.repositories.base import BaseRepository, to_object_id


class ApplicationRepository(BaseRepository):
    collection_name = "applications"

    def __init__(self, db: AsyncDatabase):
        super().__init__(db)
        self.history_collection: AsyncCollection = db["application_history"]

    async def get_by_reference(self, reference_number: str) -> dict[str, Any] | None:
        return await self.collection.find_one({"reference_number": reference_number.strip()})

    async def list_by_student(self, student_id: str) -> list[dict[str, Any]]:
        cursor = self.collection.find({"student_id": str(student_id)}).sort(
            [("created_at", DESCENDING)]
        )
        return await cursor.to_list(length=100)

    async def list_applications(
        self,
        status: ApplicationStatus | None = None,
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

    async def count_applications(self, status: ApplicationStatus | None = None) -> int:
        filter_dict: dict[str, Any] = {}
        if status:
            filter_dict["status"] = status.value
        return await self.count(filter_dict)

    async def update_status_with_history(
        self,
        application_id: str,
        previous_status: ApplicationStatus,
        new_status: ApplicationStatus,
        changed_by_user_id: str,
        changed_by_role: str,
        remarks: str | None = None,
    ) -> bool:
        obj_id = to_object_id(application_id)
        if not obj_id:
            return False

        now = datetime.now(UTC)

        # Update application status atomically
        res = await self.collection.update_one(
            {"_id": obj_id},
            {
                "$set": {
                    "status": new_status.value,
                    "updated_at": now,
                }
            },
        )
        if res.matched_count == 0:
            return False

        # Record history log entry
        history_doc = {
            "application_id": str(application_id),
            "previous_status": previous_status.value if previous_status else None,
            "new_status": new_status.value,
            "changed_by_user_id": str(changed_by_user_id),
            "changed_by_role": changed_by_role,
            "remarks": remarks,
            "created_at": now,
        }
        await self.history_collection.insert_one(history_doc)
        return True

    async def get_history(self, application_id: str) -> list[dict[str, Any]]:
        cursor = self.history_collection.find({"application_id": str(application_id)}).sort(
            [("created_at", DESCENDING)]
        )
        return await cursor.to_list(length=100)
