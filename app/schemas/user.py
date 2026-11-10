from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.common import MongoBaseModel
from app.models.enums import AccountStatus, UserRole


class UserResponse(MongoBaseModel):
    email: EmailStr
    full_name: str
    role: UserRole
    account_status: AccountStatus
    is_active: bool
    phone_number: str | None = None
    created_at: datetime
    updated_at: datetime


class UserCreateInternal(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2)
    role: UserRole
    phone_number: str | None = None


class UserStatusUpdateRequest(BaseModel):
    account_status: AccountStatus
    rejection_reason: str | None = None


class UserListResponse(BaseModel):
    items: list[UserResponse]
    total: int
    page: int
    size: int
