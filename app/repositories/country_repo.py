from typing import Any

from pymongo import ASCENDING
from pymongo.asynchronous.database import AsyncDatabase

from app.repositories.base import BaseRepository


class CountryRepository(BaseRepository):
    collection_name = "countries"

    def __init__(self, db: AsyncDatabase):
        super().__init__(db)

    async def find_by_code(self, code: str) -> dict[str, Any] | None:
        return await self.collection.find_one({"code": code.upper().strip()})

    async def list_countries(self, active_only: bool = True) -> list[dict[str, Any]]:
        filter_dict = {"is_active": True} if active_only else {}
        return await self.find_all(
            filter_query=filter_dict,
            sort=[("name", ASCENDING)],
            limit=250,
        )
