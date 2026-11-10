from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.common import MongoBaseModel
from app.models.enums import StudyLevel


class StudentProfileCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=20)
    address: str | None = Field(default=None, max_length=255)
    date_of_birth: date | None = None
    academic_qualification: str = Field(
        ..., description="e.g. High School Diploma, Bachelor's in CS"
    )
    institution: str = Field(..., description="Name of previous educational institution")
    academic_score: float = Field(
        ..., ge=0.0, le=100.0, description="Percentage or normalized score out of 100"
    )
    intended_study_level: StudyLevel
    preferred_countries: list[str] = Field(
        default_factory=list, description="List of preferred country codes/names"
    )
    budget: float = Field(..., ge=0.0, description="Annual tuition and living budget")
    intended_course: str = Field(..., description="Field of study or specific course name")


class StudentProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=100)
    phone: str | None = None
    address: str | None = None
    date_of_birth: date | None = None
    academic_qualification: str | None = None
    institution: str | None = None
    academic_score: float | None = Field(default=None, ge=0.0, le=100.0)
    intended_study_level: StudyLevel | None = None
    preferred_countries: list[str] | None = None
    budget: float | None = Field(default=None, ge=0.0)
    intended_course: str | None = None


class StudentProfileResponse(MongoBaseModel):
    user_id: str
    full_name: str
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    date_of_birth: date | None = None
    academic_qualification: str
    institution: str
    academic_score: float
    intended_study_level: StudyLevel
    preferred_countries: list[str]
    budget: float
    intended_course: str
    assigned_counselor_id: str | None = None
    created_at: datetime
    updated_at: datetime
