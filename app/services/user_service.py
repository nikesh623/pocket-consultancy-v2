from datetime import UTC, datetime
from typing import Any

from pymongo.asynchronous.database import AsyncDatabase

from app.core.exceptions import ConflictError, NotFoundError
from app.core.security import hash_password
from app.models.enums import AccountStatus, NotificationType, UserRole
from app.repositories.user_repo import UserRepository
from app.schemas.user import UserCreateInternal, UserStatusUpdateRequest
from app.services.notification_service import NotificationService


class UserService:
    def __init__(self, db: AsyncDatabase):
        self.db = db
        self.user_repo = UserRepository(db)
        self.notification_service = NotificationService(db)

    async def get_user_by_id(self, user_id: str) -> dict[str, Any]:
        user = await self.user_repo.find_by_id(user_id)
        if not user:
            raise NotFoundError("User", user_id)
        return user

    async def create_internal_user(self, data: UserCreateInternal) -> dict[str, Any]:
        """Admin creates staff accounts (Counselor, Documentation Officer, Admin)."""
        existing = await self.user_repo.find_by_email(data.email)
        if existing:
            raise ConflictError("An account with this email address already exists.")

        now = datetime.now(UTC)
        user_doc = {
            "email": data.email.lower().strip(),
            "hashed_password": hash_password(data.password),
            "full_name": data.full_name.strip(),
            "phone_number": data.phone_number.strip() if data.phone_number else None,
            "role": data.role.value,
            "account_status": AccountStatus.ACTIVE.value,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }

        user_id = await self.user_repo.insert_one(user_doc)
        user_doc["_id"] = user_id
        return user_doc

    async def update_user_status(
        self, user_id: str, data: UserStatusUpdateRequest
    ) -> dict[str, Any]:
        """Admin approves, rejects, or updates user account status."""
        await self.get_user_by_id(user_id)

        is_active = True if data.account_status == AccountStatus.ACTIVE else False
        success = await self.user_repo.update_status(
            user_id=user_id, status=data.account_status, is_active=is_active
        )
        if not success:
            raise NotFoundError("User", user_id)

        # Notify user of account status change
        msg = f"Your account status has been updated to: {data.account_status.value}."
        if data.rejection_reason:
            msg += f" Note: {data.rejection_reason}"

        await self.notification_service.send_notification(
            user_id=user_id,
            title="Account Status Update",
            message=msg,
            notification_type=NotificationType.ACCOUNT_STATUS,
        )

        return await self.get_user_by_id(user_id)

    async def list_users(
        self,
        role: UserRole | None = None,
        account_status: AccountStatus | None = None,
        page: int = 1,
        size: int = 50,
    ) -> dict[str, Any]:
        skip = (page - 1) * size
        items = await self.user_repo.list_users(
            role=role, account_status=account_status, skip=skip, limit=size
        )
        total = await self.user_repo.count_users(role=role, account_status=account_status)
        return {"items": items, "total": total, "page": page, "size": size}
