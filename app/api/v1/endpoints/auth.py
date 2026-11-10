from typing import Any

from fastapi import APIRouter, Depends, status
from pymongo.asynchronous.database import AsyncDatabase

from app.core.dependencies import get_current_user, get_db
from app.schemas.auth import (
    RefreshTokenRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
)
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Public student registration",
    description="Registers a new student account. Accounts start in 'pending' status awaiting administrator approval.",
)
async def register_student(
    data: UserRegisterRequest,
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    auth_service = AuthService(db)
    user = await auth_service.register_student(data)
    return UserResponse.model_validate(user)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="User login",
    description="Authenticate with email and password to receive JWT access and refresh tokens. Requires account status 'active'.",
)
async def login(
    data: UserLoginRequest,
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    auth_service = AuthService(db)
    return await auth_service.login(data)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
    description="Rotate tokens using a valid, unrevoked JWT refresh token.",
)
async def refresh_token(
    data: RefreshTokenRequest,
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    auth_service = AuthService(db)
    return await auth_service.refresh_tokens(data)


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="User logout",
    description="Revokes the provided refresh token so it cannot be used again.",
)
async def logout(
    data: RefreshTokenRequest,
    db: AsyncDatabase = Depends(get_db),
) -> dict[str, str]:
    auth_service = AuthService(db)
    await auth_service.logout(data.refresh_token)
    return {"message": "Successfully logged out."}


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Retrieve account details and role for the currently authenticated user.",
)
async def get_me(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> Any:
    return UserResponse.model_validate(current_user)
