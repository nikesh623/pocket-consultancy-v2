from datetime import datetime

from pydantic import BaseModel, Field

from app.models.common import MongoBaseModel


class CounselorNoteCreate(BaseModel):
    student_id: str
    title: str = Field(..., min_length=2, max_length=150)
    content: str = Field(..., min_length=5, max_length=2000)


class CounselorNoteResponse(MongoBaseModel):
    student_id: str
    counselor_id: str
    title: str
    content: str
    created_at: datetime
    updated_at: datetime


class CounselorNoteListResponse(BaseModel):
    items: list[CounselorNoteResponse]
    total: int
