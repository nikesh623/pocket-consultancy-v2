from typing import Any

from fastapi import APIRouter, Depends, Query, status
from pymongo.asynchronous.database import AsyncDatabase

from app.core.dependencies import get_current_user, get_db
from app.schemas.notification import (
    NotificationListResponse,
    NotificationResponse,
)
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get(
    "/",
    response_model=NotificationListResponse,
    summary="List notifications for current user",
)
async def list_my_notifications(
    unread_only: bool = Query(False, description="Filter only unread notifications"),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    notif_service = NotificationService(db)
    user_id = str(current_user["_id"])
    items = await notif_service.get_user_notifications(
        user_id, unread_only=unread_only, limit=limit
    )
    unread_count = await notif_service.get_unread_count(user_id)
    return {
        "items": [NotificationResponse.model_validate(n) for n in items],
        "total": len(items),
        "unread_count": unread_count,
    }


@router.patch(
    "/{notification_id}/read",
    status_code=status.HTTP_200_OK,
    summary="Mark single notification as read",
)
async def mark_notification_read(
    notification_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
) -> dict[str, str]:
    notif_service = NotificationService(db)
    await notif_service.mark_read(notification_id, str(current_user["_id"]))
    return {"message": "Notification marked as read."}


@router.post(
    "/read-all",
    status_code=status.HTTP_200_OK,
    summary="Mark all user notifications as read",
)
async def mark_all_notifications_read(
    current_user: dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
) -> dict[str, Any]:
    notif_service = NotificationService(db)
    count = await notif_service.mark_all_read(str(current_user["_id"]))
    return {"message": "All notifications marked as read.", "updated_count": count}


@router.get(
    "/unread-count",
    summary="Get unread notification count",
)
async def get_unread_count(
    current_user: dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
) -> dict[str, int]:
    notif_service = NotificationService(db)
    count = await notif_service.get_unread_count(str(current_user["_id"]))
    return {"unread_count": count}
