from datetime import datetime

from pydantic import BaseModel

from app.models.common import MongoBaseModel
from app.models.enums import NotificationType


class NotificationResponse(MongoBaseModel):
    user_id: str
    title: str
    message: str
    notification_type: NotificationType
    is_read: bool
    created_at: datetime


class NotificationListResponse(BaseModel):
    items: list[NotificationResponse]
    total: int
    unread_count: int
