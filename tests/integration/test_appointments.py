from datetime import UTC, datetime, timedelta

import pytest
from httpx import AsyncClient

from app.models.enums import AppointmentStatus


@pytest.mark.asyncio
async def test_appointment_booking_conflict_and_cancellation(
    client: AsyncClient, counselor_auth, student_auth
):
    now = datetime.now(UTC) + timedelta(days=2)
    start_time = now.replace(minute=0, second=0, microsecond=0)
    end_time = start_time + timedelta(hours=2)

    # 1. Counselor publishes availability slot
    avail_payload = {
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat(),
    }
    avail_resp = await client.post(
        "/api/v1/appointments/availability",
        headers=counselor_auth["headers"],
        json=avail_payload,
    )
    assert avail_resp.status_code == 201
    assert avail_resp.json()["is_booked"] is False

    # 2. Student books appointment within available slot
    book_time = start_time + timedelta(minutes=30)
    book_payload = {
        "counselor_id": counselor_auth["id"],
        "scheduled_at": book_time.isoformat(),
        "topic": "Master degree options in Canada",
    }
    book_resp = await client.post(
        "/api/v1/appointments/book",
        headers=student_auth["headers"],
        json=book_payload,
    )
    assert book_resp.status_code == 201
    app_data = book_resp.json()
    appointment_id = app_data["id"]
    assert app_data["status"] == AppointmentStatus.SCHEDULED.value

    # 3. Attempt booking outside availability slot -> rejected
    outside_time = start_time + timedelta(hours=5)
    invalid_book = await client.post(
        "/api/v1/appointments/book",
        headers=student_auth["headers"],
        json={
            "counselor_id": counselor_auth["id"],
            "scheduled_at": outside_time.isoformat(),
            "topic": "Outside slot",
        },
    )
    assert invalid_book.status_code == 422

    # 4. Attempt conflicting booking for same counselor at same time -> rejected
    conflict_book = await client.post(
        "/api/v1/appointments/book",
        headers=student_auth["headers"],
        json=book_payload,
    )
    assert conflict_book.status_code in [409, 422]

    # 5. Cancel appointment -> restores availability slot
    cancel_resp = await client.post(
        f"/api/v1/appointments/{appointment_id}/cancel",
        headers=student_auth["headers"],
        json={"reason": "Schedule clash, need to reschedule"},
    )
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == AppointmentStatus.CANCELLED.value

    # Verify slot is unbooked again
    avail_list = await client.get(
        f"/api/v1/appointments/availability?counselor_id={counselor_auth['id']}&unbooked_only=true",
        headers=student_auth["headers"],
    )
    assert avail_list.status_code == 200
    assert len(avail_list.json()) >= 1
