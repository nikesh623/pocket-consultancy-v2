from typing import Any

from fastapi import APIRouter, Body, Depends, Query, status
from pymongo.asynchronous.database import AsyncDatabase

from app.core.dependencies import (
    get_current_user,
    get_db,
    require_counselor,
    require_student,
)
from app.models.enums import AppointmentStatus
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentListResponse,
    AppointmentResponse,
    AppointmentStatusUpdate,
    AvailabilityCreate,
    AvailabilityResponse,
)
from app.services.appointment_service import AppointmentService

router = APIRouter(prefix="/appointments", tags=["Counselor Availability & Appointments"])


@router.post(
    "/availability",
    response_model=AvailabilityResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Counselor add availability slot",
)
async def add_counselor_availability(
    data: AvailabilityCreate,
    current_user: dict[str, Any] = Depends(require_counselor),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    appointment_service = AppointmentService(db)
    slot = await appointment_service.add_availability(str(current_user["_id"]), data)
    return AvailabilityResponse.model_validate(slot)


@router.get(
    "/availability",
    response_model=list[AvailabilityResponse],
    summary="List counselor availability slots",
)
async def list_availability_slots(
    counselor_id: str = Query(..., description="Target counselor user ID"),
    unbooked_only: bool = Query(True, description="Filter only available slots"),
    db: AsyncDatabase = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> Any:
    appointment_service = AppointmentService(db)
    slots = await appointment_service.list_availability(counselor_id, unbooked_only=unbooked_only)
    return [AvailabilityResponse.model_validate(s) for s in slots]


@router.post(
    "/book",
    response_model=AppointmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Student book appointment",
)
async def book_appointment(
    data: AppointmentCreate,
    current_user: dict[str, Any] = Depends(require_student),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    appointment_service = AppointmentService(db)
    appointment = await appointment_service.book_appointment(str(current_user["_id"]), data)
    return AppointmentResponse.model_validate(appointment)


@router.post(
    "/{appointment_id}/cancel",
    response_model=AppointmentResponse,
    summary="Cancel appointment",
    description="Authorized for owner student, assigned counselor, or admin. Restores availability slot.",
)
async def cancel_appointment(
    appointment_id: str,
    reason: str | None = Body(None, embed=True),
    current_user: dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    appointment_service = AppointmentService(db)
    updated = await appointment_service.cancel_appointment(
        appointment_id=appointment_id,
        requesting_user=current_user,
        cancellation_reason=reason,
    )
    return AppointmentResponse.model_validate(updated)


@router.patch(
    "/{appointment_id}/status",
    response_model=AppointmentResponse,
    summary="Counselor or Admin update appointment status",
)
async def update_appointment_status(
    appointment_id: str,
    data: AppointmentStatusUpdate,
    current_user: dict[str, Any] = Depends(require_counselor),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    appointment_service = AppointmentService(db)
    updated = await appointment_service.update_appointment_status(
        appointment_id=appointment_id,
        new_status=data.status,
        requesting_user=current_user,
    )
    return AppointmentResponse.model_validate(updated)


@router.get(
    "/",
    response_model=AppointmentListResponse,
    summary="List appointments",
)
async def list_appointments(
    status: AppointmentStatus | None = Query(None, description="Filter by status"),
    student_id: str | None = Query(None, description="Filter by student (staff only)"),
    counselor_id: str | None = Query(None, description="Filter by counselor (staff only)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    appointment_service = AppointmentService(db)
    items = await appointment_service.list_appointments(
        requesting_user=current_user,
        student_id=student_id,
        counselor_id=counselor_id,
        status=status,
        skip=skip,
        limit=limit,
    )
    return {
        "items": [AppointmentResponse.model_validate(a) for a in items],
        "total": len(items),
    }
