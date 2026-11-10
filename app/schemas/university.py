from datetime import datetime

from pydantic import BaseModel, Field

from app.models.common import MongoBaseModel


class UniversityCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    country_id: str = Field(..., description="ID of associated country")
    city: str = Field(..., min_length=2, max_length=100)
    website: str | None = None
    description: str | None = None
    is_active: bool = True


class UniversityUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    country_id: str | None = None
    city: str | None = None
    website: str | None = None
    description: str | None = None
    is_active: bool | None = None


class UniversityResponse(MongoBaseModel):
    name: str
    country_id: str
    city: str
    website: str | None = None
    description: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class UniversityListResponse(BaseModel):
    items: list[UniversityResponse]
    total: int
    page: int
    size: int
