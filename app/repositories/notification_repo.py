from datetime import UTC, datetime
from typing import Any

from pymongo import DESCENDING
from pymongo.asynchronous.database import AsyncDatabase

from app.models.enums import NotificationType
from app.repositories.base import BaseRepository, to_object_id


class NotificationRepository(BaseRepository):
    collection_name = "notifications"

    def __init__(self, db: AsyncDatabase):
        super().__init__(db)

    async def create_notification(
        self, user_id: str, title: str, message: str, notification_type: NotificationType
    ) -> str:
        doc = {
            "user_id": str(user_id),
            "title": title,
            "message": message,
            "notification_type": notification_type.value,
            "is_read": False,
            "created_at": datetime.now(UTC),
        }
        return await self.insert_one(doc)

    async def list_user_notifications(
        self, user_id: str, unread_only: bool = False, limit: int = 50
    ) -> list[dict[str, Any]]:
        filter_dict: dict[str, Any] = {"user_id": str(user_id)}
        if unread_only:
            filter_dict["is_read"] = False
        cursor = self.collection.find(filter_dict).sort([("created_at", DESCENDING)]).limit(limit)
        return await cursor.to_list(length=limit)

    async def mark_as_read(self, notification_id: str, user_id: str) -> bool:
        obj_id = to_object_id(notification_id)
        if not obj_id:
            return False
        res = await self.collection.update_one(
            {"_id": obj_id, "user_id": str(user_id)},
            {"$set": {"is_read": True}},
        )
        return res.modified_count > 0 or res.matched_count > 0

    async def mark_all_read(self, user_id: str) -> int:
        res = await self.collection.update_many(
            {"user_id": str(user_id), "is_read": False},
            {"$set": {"is_read": True}},
        )
        return res.modified_count

    async def mark_all_as_read(self, user_id: str) -> int:
        return await self.mark_all_read(user_id)

    async def get_unread_count(self, user_id: str) -> int:
        return await self.collection.count_documents({"user_id": str(user_id), "is_read": False})
