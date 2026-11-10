from datetime import datetime

from pydantic import BaseModel, Field

from app.models.common import MongoBaseModel
from app.models.enums import StudyLevel


class CourseCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    university_id: str
    country_id: str
    study_level: StudyLevel
    duration_months: int = Field(..., gt=0, le=96)
    tuition_fee: float = Field(..., ge=0.0)
    currency: str = Field(default="USD", max_length=10)
    min_academic_score: float = Field(default=50.0, ge=0.0, le=100.0)
    entry_requirements: str = Field(..., min_length=5)
    description: str | None = None
    is_active: bool = True


class CourseUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    university_id: str | None = None
    country_id: str | None = None
    study_level: StudyLevel | None = None
    duration_months: int | None = Field(default=None, gt=0, le=96)
    tuition_fee: float | None = Field(default=None, ge=0.0)
    currency: str | None = None
    min_academic_score: float | None = Field(default=None, ge=0.0, le=100.0)
    entry_requirements: str | None = None
    description: str | None = None
    is_active: bool | None = None


class CourseResponse(MongoBaseModel):
    name: str
    university_id: str
    country_id: str
    study_level: StudyLevel
    duration_months: int
    tuition_fee: float
    currency: str
    min_academic_score: float
    entry_requirements: str
    description: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class CourseListResponse(BaseModel):
    items: list[CourseResponse]
    total: int
    page: int
    size: int
