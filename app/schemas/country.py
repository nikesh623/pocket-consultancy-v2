from datetime import datetime

from pydantic import BaseModel, Field

from app.models.common import MongoBaseModel


class CountryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=2, max_length=5, description="ISO Code, e.g. US, UK, CA, AU")
    description: str | None = None
    currency: str = Field(default="USD", max_length=10)
    is_active: bool = True


class CountryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    code: str | None = Field(default=None, min_length=2, max_length=5)
    description: str | None = None
    currency: str | None = None
    is_active: bool | None = None


class CountryResponse(MongoBaseModel):
    name: str
    code: str
    description: str | None = None
    currency: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class CountryListResponse(BaseModel):
    items: list[CountryResponse]
    total: int
