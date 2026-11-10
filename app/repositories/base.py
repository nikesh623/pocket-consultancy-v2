from datetime import UTC, datetime
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId
from pymongo.asynchronous.collection import AsyncCollection
from pymongo.asynchronous.database import AsyncDatabase


def to_object_id(val: Any) -> ObjectId | None:
    if isinstance(val, ObjectId):
        return val
    try:
        return ObjectId(str(val))
    except (InvalidId, TypeError):
        return None


class BaseRepository:
    collection_name: str

    def __init__(self, db: AsyncDatabase):
        self.db = db
        self.collection: AsyncCollection = db[self.collection_name]

    async def find_by_id(self, item_id: str) -> dict[str, Any] | None:
        obj_id = to_object_id(item_id)
        if not obj_id:
            return None
        doc = await self.collection.find_one({"_id": obj_id})
        return doc

    async def find_one(self, filter_query: dict[str, Any]) -> dict[str, Any] | None:
        return await self.collection.find_one(filter_query)

    async def insert_one(self, data: dict[str, Any]) -> str:
        now = datetime.now(UTC)
        if "created_at" not in data:
            data["created_at"] = now
        if "updated_at" not in data:
            data["updated_at"] = now

        result = await self.collection.insert_one(data)
        return str(result.inserted_id)

    async def update_by_id(self, item_id: str, update_data: dict[str, Any]) -> bool:
        obj_id = to_object_id(item_id)
        if not obj_id:
            return False

        update_data["updated_at"] = datetime.now(UTC)
        result = await self.collection.update_one(
            {"_id": obj_id},
            {"$set": update_data},
        )
        return result.modified_count > 0 or result.matched_count > 0

    async def delete_by_id(self, item_id: str) -> bool:
        obj_id = to_object_id(item_id)
        if not obj_id:
            return False
        result = await self.collection.delete_one({"_id": obj_id})
        return result.deleted_count > 0

    async def count(self, filter_query: dict[str, Any] | None = None) -> int:
        return await self.collection.count_documents(filter_query or {})

    async def find_all(
        self,
        filter_query: dict[str, Any] | None = None,
        sort: list[Any] | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        cursor = self.collection.find(filter_query or {})
        if sort:
            cursor = cursor.sort(sort)
        if skip:
            cursor = cursor.skip(skip)
        if limit:
            cursor = cursor.limit(limit)
        return await cursor.to_list(length=limit)
