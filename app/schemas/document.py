from datetime import datetime

from pydantic import BaseModel, Field

from app.models.common import MongoBaseModel
from app.models.enums import DocumentCategory, DocumentStatus


class DocumentReviewRequest(BaseModel):
    status: DocumentStatus = Field(..., description="Approved or Rejected")
    feedback: str | None = Field(
        default=None, max_length=500, description="Reviewer comments or rejection reason"
    )


class DocumentResponse(MongoBaseModel):
    student_id: str
    original_filename: str
    stored_filename: str
    category: DocumentCategory
    file_size_bytes: int
    content_type: str
    status: DocumentStatus
    reviewer_id: str | None = None
    review_feedback: str | None = None
    reviewed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class DocumentListResponse(BaseModel):
    items: list[DocumentResponse]
    total: int
