from typing import Any

from pymongo.asynchronous.database import AsyncDatabase

from app.models.enums import NotificationType
from app.repositories.notification_repo import NotificationRepository


class NotificationService:
    def __init__(self, db: AsyncDatabase):
        self.repo = NotificationRepository(db)

    async def send_notification(
        self, user_id: str, title: str, message: str, notification_type: NotificationType
    ) -> str:
        return await self.repo.create_notification(user_id, title, message, notification_type)

    async def get_user_notifications(
        self, user_id: str, unread_only: bool = False, limit: int = 50
    ) -> list[dict[str, Any]]:
        return await self.repo.list_user_notifications(
            user_id, unread_only=unread_only, limit=limit
        )

    async def mark_read(self, notification_id: str, user_id: str) -> bool:
        return await self.repo.mark_as_read(notification_id, user_id)

    async def mark_all_read(self, user_id: str) -> int:
        return await self.repo.mark_all_read(user_id)

    async def get_unread_count(self, user_id: str) -> int:
        return await self.repo.get_unread_count(user_id)
