from datetime import datetime

from pydantic import BaseModel, Field

from app.models.common import MongoBaseModel
from app.models.enums import ApplicationStatus
from app.schemas.course import CourseResponse


class ApplicationCreate(BaseModel):
    course_id: str
    remarks: str | None = Field(default=None, max_length=500)


class ApplicationStatusTransitionRequest(BaseModel):
    new_status: ApplicationStatus
    remarks: str | None = Field(default=None, max_length=500)


class ApplicationHistoryResponse(MongoBaseModel):
    application_id: str
    previous_status: ApplicationStatus | None = None
    new_status: ApplicationStatus
    changed_by_user_id: str
    changed_by_role: str
    remarks: str | None = None
    created_at: datetime


class ApplicationResponse(MongoBaseModel):
    reference_number: str
    student_id: str
    course_id: str
    status: ApplicationStatus
    remarks: str | None = None
    created_at: datetime
    updated_at: datetime


class ApplicationDetailResponse(BaseModel):
    application: ApplicationResponse
    history: list[ApplicationHistoryResponse]
    course: CourseResponse | None = None


class ApplicationListResponse(BaseModel):
    items: list[ApplicationResponse]
    total: int
    page: int
    size: int
