from datetime import UTC, datetime
from typing import Any

from pymongo import ASCENDING, DESCENDING
from pymongo.asynchronous.collection import AsyncCollection
from pymongo.asynchronous.database import AsyncDatabase

from app.models.enums import AppointmentStatus
from app.repositories.base import BaseRepository, to_object_id


class AppointmentRepository(BaseRepository):
    collection_name = "appointments"

    def __init__(self, db: AsyncDatabase):
        super().__init__(db)
        self.avail_collection: AsyncCollection = db["counselor_availability"]

    # Counselor Availability
    async def create_availability_slot(
        self, counselor_id: str, start_time: datetime, end_time: datetime
    ) -> dict[str, Any]:
        doc = {
            "counselor_id": str(counselor_id),
            "start_time": start_time,
            "end_time": end_time,
            "is_booked": False,
            "created_at": datetime.now(UTC),
        }
        res = await self.avail_collection.insert_one(doc)
        doc["_id"] = res.inserted_id
        return doc

    async def list_counselor_availability(
        self, counselor_id: str, unbooked_only: bool = True
    ) -> list[dict[str, Any]]:
        filter_dict: dict[str, Any] = {"counselor_id": str(counselor_id)}
        if unbooked_only:
            filter_dict["is_booked"] = False
        cursor = self.avail_collection.find(filter_dict).sort([("start_time", ASCENDING)])
        return await cursor.to_list(length=100)

    async def find_matching_slot(
        self, counselor_id: str, scheduled_at: datetime
    ) -> dict[str, Any] | None:
        """Find an available unbooked slot that covers scheduled_at."""
        return await self.avail_collection.find_one(
            {
                "counselor_id": str(counselor_id),
                "is_booked": False,
                "start_time": {"$lte": scheduled_at},
                "end_time": {"$gt": scheduled_at},
            }
        )

    async def set_slot_booked(self, slot_id: Any, is_booked: bool) -> bool:
        obj_id = to_object_id(slot_id)
        if not obj_id:
            return False
        res = await self.avail_collection.update_one(
            {"_id": obj_id},
            {"$set": {"is_booked": is_booked}},
        )
        return res.modified_count > 0 or res.matched_count > 0

    async def release_slot_for_time(self, counselor_id: str, scheduled_at: datetime) -> bool:
        """Find slot covering scheduled_at and mark is_booked=False."""
        res = await self.avail_collection.update_one(
            {
                "counselor_id": str(counselor_id),
                "start_time": {"$lte": scheduled_at},
                "end_time": {"$gt": scheduled_at},
            },
            {"$set": {"is_booked": False}},
        )
        return res.modified_count > 0

    # Appointments
    async def find_existing_appointment(
        self, counselor_id: str, scheduled_at: datetime
    ) -> dict[str, Any] | None:
        return await self.collection.find_one(
            {
                "counselor_id": str(counselor_id),
                "scheduled_at": scheduled_at,
                "status": {
                    "$in": [AppointmentStatus.SCHEDULED.value, AppointmentStatus.CONFIRMED.value]
                },
            }
        )

    async def create_appointment(self, appointment_data: dict[str, Any]) -> str:
        return await self.insert_one(appointment_data)

    async def update_status(
        self, appointment_id: str, status: AppointmentStatus, cancellation_reason: str | None = None
    ) -> bool:
        update_data: dict[str, Any] = {"status": status.value}
        if cancellation_reason:
            update_data["cancellation_reason"] = cancellation_reason
        return await self.update_by_id(appointment_id, update_data)

    async def list_appointments(
        self,
        student_id: str | None = None,
        counselor_id: str | None = None,
        status: AppointmentStatus | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        filter_dict: dict[str, Any] = {}
        if student_id:
            filter_dict["student_id"] = str(student_id)
        if counselor_id:
            filter_dict["counselor_id"] = str(counselor_id)
        if status:
            filter_dict["status"] = status.value

        return await self.find_all(
            filter_query=filter_dict,
            sort=[("scheduled_at", DESCENDING)],
            skip=skip,
            limit=limit,
        )
