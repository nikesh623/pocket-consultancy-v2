import pytest
from httpx import AsyncClient

from app.models.enums import NotificationType
from app.services.notification_service import NotificationService


@pytest.mark.asyncio
async def test_notifications_workflow(client: AsyncClient, student_auth, test_db):
    notif_service = NotificationService(test_db)
    user_id = student_auth["id"]

    # 1. Dispatch 3 test notifications
    n1 = await notif_service.send_notification(
        user_id=user_id,
        title="Notice 1",
        message="Message 1",
        notification_type=NotificationType.ACCOUNT_STATUS,
    )
    await notif_service.send_notification(
        user_id=user_id,
        title="Notice 2",
        message="Message 2",
        notification_type=NotificationType.APPOINTMENT,
    )
    await notif_service.send_notification(
        user_id=user_id,
        title="Notice 3",
        message="Message 3",
        notification_type=NotificationType.APPLICATION,
    )

    # 2. Check unread count
    cnt_resp = await client.get(
        "/api/v1/notifications/unread-count",
        headers=student_auth["headers"],
    )
    assert cnt_resp.status_code == 200
    assert cnt_resp.json()["unread_count"] == 3

    # 3. Mark single notification as read
    read_resp = await client.patch(
        f"/api/v1/notifications/{n1}/read",
        headers=student_auth["headers"],
    )
    assert read_resp.status_code == 200

    cnt2 = await client.get(
        "/api/v1/notifications/unread-count",
        headers=student_auth["headers"],
    )
    assert cnt2.json()["unread_count"] == 2

    # 4. Mark all as read
    read_all = await client.post(
        "/api/v1/notifications/read-all",
        headers=student_auth["headers"],
    )
    assert read_all.status_code == 200
    assert read_all.json()["updated_count"] == 2

    # 5. Unread count is now 0
    cnt3 = await client.get(
        "/api/v1/notifications/unread-count",
        headers=student_auth["headers"],
    )
    assert cnt3.json()["unread_count"] == 0
