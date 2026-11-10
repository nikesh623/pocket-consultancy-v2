from typing import Any

from pymongo import DESCENDING
from pymongo.asynchronous.database import AsyncDatabase

from app.models.enums import AccountStatus, UserRole
from app.repositories.base import BaseRepository, to_object_id


class UserRepository(BaseRepository):
    collection_name = "users"

    def __init__(self, db: AsyncDatabase):
        super().__init__(db)

    async def find_by_email(self, email: str) -> dict[str, Any] | None:
        return await self.collection.find_one({"email": email.lower().strip()})

    async def update_status(
        self, user_id: str, status: AccountStatus, is_active: bool | None = None
    ) -> bool:
        obj_id = to_object_id(user_id)
        if not obj_id:
            return False
        update_doc: dict[str, Any] = {"account_status": status.value}
        if is_active is not None:
            update_doc["is_active"] = is_active
        return await self.update_by_id(user_id, update_doc)

    async def list_users(
        self,
        role: UserRole | None = None,
        account_status: AccountStatus | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        filter_dict: dict[str, Any] = {}
        if role:
            filter_dict["role"] = role.value
        if account_status:
            filter_dict["account_status"] = account_status.value

        return await self.find_all(
            filter_query=filter_dict,
            sort=[("created_at", DESCENDING)],
            skip=skip,
            limit=limit,
        )

    async def count_users(
        self,
        role: UserRole | None = None,
        account_status: AccountStatus | None = None,
    ) -> int:
        filter_dict: dict[str, Any] = {}
        if role:
            filter_dict["role"] = role.value
        if account_status:
            filter_dict["account_status"] = account_status.value
        return await self.count(filter_dict)
