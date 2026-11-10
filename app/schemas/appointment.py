from datetime import datetime

from pydantic import BaseModel, Field

from app.models.common import MongoBaseModel
from app.models.enums import AppointmentStatus


class AvailabilityCreate(BaseModel):
    start_time: datetime = Field(..., description="UTC start datetime")
    end_time: datetime = Field(..., description="UTC end datetime")


class AvailabilityResponse(MongoBaseModel):
    counselor_id: str
    start_time: datetime
    end_time: datetime
    is_booked: bool
    created_at: datetime


class AppointmentCreate(BaseModel):
    counselor_id: str
    scheduled_at: datetime = Field(..., description="UTC scheduled appointment start datetime")
    topic: str | None = Field(default=None, max_length=200)


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus
    cancellation_reason: str | None = None


class AppointmentResponse(MongoBaseModel):
    counselor_id: str
    student_id: str
    scheduled_at: datetime
    status: AppointmentStatus
    topic: str | None = None
    cancellation_reason: str | None = None
    created_at: datetime
    updated_at: datetime


class AppointmentListResponse(BaseModel):
    items: list[AppointmentResponse]
    total: int
