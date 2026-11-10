from datetime import datetime

from pydantic import BaseModel

from app.models.common import MongoBaseModel
from app.schemas.course import CourseResponse


class ShortlistCreate(BaseModel):
    course_id: str


class ShortlistResponse(MongoBaseModel):
    student_id: str
    course_id: str
    course: CourseResponse | None = None
    created_at: datetime


class ShortlistListResponse(BaseModel):
    items: list[ShortlistResponse]
    total: int
