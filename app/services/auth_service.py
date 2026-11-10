from datetime import UTC, datetime
from typing import Any

import jwt
from pymongo.asynchronous.database import AsyncDatabase

from app.core.config import get_settings
from app.core.exceptions import AuthenticationError, ConflictError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.enums import AccountStatus, NotificationType, UserRole
from app.repositories.token_repo import TokenRepository
from app.repositories.user_repo import UserRepository
from app.schemas.auth import (
    RefreshTokenRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
)
from app.services.notification_service import NotificationService

settings = get_settings()


class AuthService:
    def __init__(self, db: AsyncDatabase):
        self.db = db
        self.user_repo = UserRepository(db)
        self.token_repo = TokenRepository(db)
        self.notification_service = NotificationService(db)

    async def register_student(self, data: UserRegisterRequest) -> dict[str, Any]:
        """Public student registration. Account starts in PENDING status awaiting Admin approval."""
        existing_user = await self.user_repo.find_by_email(data.email)
        if existing_user:
            raise ConflictError("An account with this email address already exists.")

        now = datetime.now(UTC)
        user_doc = {
            "email": data.email.lower().strip(),
            "hashed_password": hash_password(data.password),
            "full_name": data.full_name.strip(),
            "phone_number": data.phone_number.strip() if data.phone_number else None,
            "role": UserRole.STUDENT.value,
            "account_status": AccountStatus.PENDING.value,
            "is_active": False,
            "created_at": now,
            "updated_at": now,
        }

        user_id = await self.user_repo.insert_one(user_doc)
        user_doc["_id"] = user_id

        # Notify student about registration pending approval
        await self.notification_service.send_notification(
            user_id=user_id,
            title="Registration Submitted",
            message="Your student registration has been received and is pending administrator approval.",
            notification_type=NotificationType.ACCOUNT_STATUS,
        )

        return user_doc

    async def login(self, data: UserLoginRequest) -> TokenResponse:
        """Authenticate user and return JWT access + refresh tokens."""
        user = await self.user_repo.find_by_email(data.email)
        if not user or not verify_password(data.password, user.get("hashed_password", "")):
            raise AuthenticationError("Invalid email or password.")

        status = user.get("account_status")
        if status == AccountStatus.PENDING.value:
            raise AuthenticationError(
                "Your account registration is pending administrator approval."
            )
        if status == AccountStatus.REJECTED.value:
            raise AuthenticationError("Your account registration was rejected by an administrator.")
        if status != AccountStatus.ACTIVE.value or not user.get("is_active", False):
            raise AuthenticationError("Your account is deactivated. Please contact support.")

        user_id = str(user["_id"])
        role = user.get("role", UserRole.STUDENT.value)

        access_token = create_access_token(subject=user_id, role=role)
        refresh_token = create_refresh_token(subject=user_id, role=role)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        )

    async def refresh_tokens(self, data: RefreshTokenRequest) -> TokenResponse:
        """Validate refresh token and issue new token pair."""
        try:
            payload = decode_token(data.refresh_token)
        except jwt.PyJWTError:
            raise AuthenticationError("Invalid or expired refresh token.") from None

        if payload.get("type") != "refresh":
            raise AuthenticationError("Token is not a valid refresh token.")

        jti = payload.get("jti")
        if not jti or await self.token_repo.is_revoked(jti):
            raise AuthenticationError("Refresh token has been revoked.")

        user_id = payload.get("sub")
        user = await self.user_repo.find_by_id(user_id)
        if not user or user.get("account_status") != AccountStatus.ACTIVE.value:
            raise AuthenticationError("User is no longer active.")

        # Revoke the old refresh token (refresh token rotation)
        exp_timestamp = payload.get("exp", 0)
        exp_dt = datetime.fromtimestamp(exp_timestamp, tz=UTC)
        await self.token_repo.revoke_token(jti, exp_dt)

        role = user.get("role", UserRole.STUDENT.value)
        new_access_token = create_access_token(subject=user_id, role=role)
        new_refresh_token = create_refresh_token(subject=user_id, role=role)

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        )

    async def logout(self, refresh_token: str) -> None:
        """Revoke refresh token on user logout."""
        try:
            payload = decode_token(refresh_token)
            if payload.get("type") == "refresh" and "jti" in payload:
                exp_timestamp = payload.get("exp", 0)
                exp_dt = datetime.fromtimestamp(exp_timestamp, tz=UTC)
                await self.token_repo.revoke_token(payload["jti"], exp_dt)
        except jwt.PyJWTError:
            # If token already invalid/expired, logout is still considered successful
            pass
