from datetime import UTC, datetime
from typing import Any

from pymongo.asynchronous.database import AsyncDatabase

from app.core.exceptions import (
    AuthorizationError,
    ConflictError,
    DomainValidationError,
    NotFoundError,
)
from app.models.enums import AppointmentStatus, NotificationType, UserRole
from app.repositories.appointment_repo import AppointmentRepository
from app.repositories.user_repo import UserRepository
from app.schemas.appointment import AppointmentCreate, AvailabilityCreate
from app.services.notification_service import NotificationService


class AppointmentService:
    def __init__(self, db: AsyncDatabase):
        self.db = db
        self.appointment_repo = AppointmentRepository(db)
        self.user_repo = UserRepository(db)
        self.notification_service = NotificationService(db)

    # Availability
    async def add_availability(self, counselor_id: str, data: AvailabilityCreate) -> dict[str, Any]:
        if data.end_time <= data.start_time:
            raise DomainValidationError("End time must be strictly after start time.")
        return await self.appointment_repo.create_availability_slot(
            counselor_id=counselor_id,
            start_time=data.start_time,
            end_time=data.end_time,
        )

    async def list_availability(
        self, counselor_id: str, unbooked_only: bool = True
    ) -> list[dict[str, Any]]:
        return await self.appointment_repo.list_counselor_availability(
            counselor_id=counselor_id, unbooked_only=unbooked_only
        )

    # Booking
    async def book_appointment(self, student_id: str, data: AppointmentCreate) -> dict[str, Any]:
        # Verify counselor exists and is active counselor
        counselor = await self.user_repo.find_by_id(data.counselor_id)
        if not counselor or counselor.get("role") != UserRole.COUNSELOR.value:
            raise NotFoundError("Counselor", data.counselor_id)

        # 1. Verify availability slot exists covering scheduled_at
        slot = await self.appointment_repo.find_matching_slot(
            counselor_id=data.counselor_id, scheduled_at=data.scheduled_at
        )
        if not slot:
            raise DomainValidationError(
                "Requested time is outside the counselor's published availability or already booked."
            )

        # 2. Check for conflicting appointments
        conflict = await self.appointment_repo.find_existing_appointment(
            counselor_id=data.counselor_id, scheduled_at=data.scheduled_at
        )
        if conflict:
            raise ConflictError(
                "A scheduled appointment already exists for this counselor at this time."
            )

        # Mark slot booked
        await self.appointment_repo.set_slot_booked(slot["_id"], is_booked=True)

        now = datetime.now(UTC)
        appointment_doc = {
            "counselor_id": str(data.counselor_id),
            "student_id": str(student_id),
            "scheduled_at": data.scheduled_at,
            "status": AppointmentStatus.SCHEDULED.value,
            "topic": data.topic,
            "created_at": now,
            "updated_at": now,
        }

        app_id = await self.appointment_repo.create_appointment(appointment_doc)
        appointment_doc["_id"] = app_id

        # Notify counselor of new booking
        await self.notification_service.send_notification(
            user_id=data.counselor_id,
            title="New Counseling Appointment Booked",
            message=f"A student booked a counseling appointment for {data.scheduled_at.isoformat()}.",
            notification_type=NotificationType.APPOINTMENT,
        )

        return appointment_doc

    async def cancel_appointment(
        self,
        appointment_id: str,
        requesting_user: dict[str, Any],
        cancellation_reason: str | None = None,
    ) -> dict[str, Any]:
        appointment = await self.appointment_repo.find_by_id(appointment_id)
        if not appointment:
            raise NotFoundError("Appointment", appointment_id)

        req_role = requesting_user.get("role")
        req_id = str(requesting_user.get("_id"))

        # Authorization: owner student, assigned counselor, or admin
        is_owner_student = appointment.get("student_id") == req_id
        is_assigned_counselor = appointment.get("counselor_id") == req_id
        is_admin = req_role == UserRole.ADMIN.value

        if not (is_owner_student or is_assigned_counselor or is_admin):
            raise AuthorizationError("You are not authorized to cancel this appointment.")

        current_status = appointment.get("status")
        if current_status == AppointmentStatus.CANCELLED.value:
            raise DomainValidationError("Appointment is already cancelled.")

        # Update appointment status
        await self.appointment_repo.update_status(
            appointment_id=appointment_id,
            status=AppointmentStatus.CANCELLED,
            cancellation_reason=cancellation_reason or "Cancelled by user request.",
        )

        # Restore availability slot for counselor
        await self.appointment_repo.release_slot_for_time(
            counselor_id=appointment["counselor_id"],
            scheduled_at=appointment["scheduled_at"],
        )

        # Notify other party
        recipient_id = (
            appointment["counselor_id"] if is_owner_student else appointment["student_id"]
        )
        await self.notification_service.send_notification(
            user_id=recipient_id,
            title="Appointment Cancelled",
            message=f"The appointment on {appointment['scheduled_at']} was cancelled.",
            notification_type=NotificationType.APPOINTMENT,
        )

        return await self.appointment_repo.find_by_id(appointment_id)

    async def update_appointment_status(
        self, appointment_id: str, new_status: AppointmentStatus, requesting_user: dict[str, Any]
    ) -> dict[str, Any]:
        appointment = await self.appointment_repo.find_by_id(appointment_id)
        if not appointment:
            raise NotFoundError("Appointment", appointment_id)

        req_role = requesting_user.get("role")
        req_id = str(requesting_user.get("_id"))

        # Only assigned counselor or admin can confirm / complete
        if req_role != UserRole.ADMIN.value and appointment.get("counselor_id") != req_id:
            raise AuthorizationError(
                "Only assigned counselor or admin can update appointment status."
            )

        await self.appointment_repo.update_status(appointment_id, new_status)
        return await self.appointment_repo.find_by_id(appointment_id)

    async def list_appointments(
        self,
        requesting_user: dict[str, Any],
        student_id: str | None = None,
        counselor_id: str | None = None,
        status: AppointmentStatus | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        req_role = requesting_user.get("role")
        req_id = str(requesting_user.get("_id"))

        # Role-based restriction
        if req_role == UserRole.STUDENT.value:
            student_id = req_id  # Force student to see only their appointments
        elif req_role == UserRole.COUNSELOR.value:
            if not student_id:
                counselor_id = req_id  # Counselor defaults to their appointments

        return await self.appointment_repo.list_appointments(
            student_id=student_id,
            counselor_id=counselor_id,
            status=status,
            skip=skip,
            limit=limit,
        )
