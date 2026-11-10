from typing import Any

from fastapi import APIRouter, Depends, Query, status
from pymongo.asynchronous.database import AsyncDatabase

from app.core.dependencies import get_db, require_admin
from app.models.enums import AccountStatus, UserRole
from app.schemas.user import (
    UserCreateInternal,
    UserListResponse,
    UserResponse,
    UserStatusUpdateRequest,
)
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["User Administration"])


@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Admin create internal user",
    description="Administrators can create Counselor, Documentation Officer, or Admin accounts directly in 'active' status.",
)
async def create_internal_user(
    data: UserCreateInternal,
    current_admin: dict[str, Any] = Depends(require_admin),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    user_service = UserService(db)
    user = await user_service.create_internal_user(data)
    return UserResponse.model_validate(user)


@router.get(
    "/",
    response_model=UserListResponse,
    summary="Admin list users",
    description="List system users with optional role, account status filtering, and pagination.",
)
async def list_users(
    role: UserRole | None = Query(None, description="Filter by role"),
    account_status: AccountStatus | None = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_admin: dict[str, Any] = Depends(require_admin),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    user_service = UserService(db)
    result = await user_service.list_users(
        role=role, account_status=account_status, page=page, size=size
    )
    return {
        "items": [UserResponse.model_validate(u) for u in result["items"]],
        "total": result["total"],
        "page": result["page"],
        "size": result["size"],
    }


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Admin get user by ID",
)
async def get_user_by_id(
    user_id: str,
    current_admin: dict[str, Any] = Depends(require_admin),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    user_service = UserService(db)
    user = await user_service.get_user_by_id(user_id)
    return UserResponse.model_validate(user)


@router.patch(
    "/{user_id}/status",
    response_model=UserResponse,
    summary="Admin update account status",
    description="Approve newly registered students ('active'), reject them ('rejected'), or activate/deactivate accounts.",
)
async def update_user_status(
    user_id: str,
    data: UserStatusUpdateRequest,
    current_admin: dict[str, Any] = Depends(require_admin),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    user_service = UserService(db)
    user = await user_service.update_user_status(user_id, data)
    return UserResponse.model_validate(user)
