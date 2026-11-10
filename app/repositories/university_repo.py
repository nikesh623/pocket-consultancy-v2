from typing import Any

from pymongo import ASCENDING
from pymongo.asynchronous.database import AsyncDatabase

from app.repositories.base import BaseRepository


class UniversityRepository(BaseRepository):
    collection_name = "universities"

    def __init__(self, db: AsyncDatabase):
        super().__init__(db)

    async def list_universities(
        self,
        country_id: str | None = None,
        active_only: bool = True,
        skip: int = 0,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        filter_dict: dict[str, Any] = {}
        if active_only:
            filter_dict["is_active"] = True
        if country_id:
            filter_dict["country_id"] = str(country_id)

        return await self.find_all(
            filter_query=filter_dict,
            sort=[("name", ASCENDING)],
            skip=skip,
            limit=limit,
        )

    async def count_universities(
        self, country_id: str | None = None, active_only: bool = True
    ) -> int:
        filter_dict: dict[str, Any] = {}
        if active_only:
            filter_dict["is_active"] = True
        if country_id:
            filter_dict["country_id"] = str(country_id)
        return await self.count(filter_dict)
