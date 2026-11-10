from datetime import datetime

from pymongo.asynchronous.database import AsyncDatabase

from app.repositories.base import BaseRepository


class TokenRepository(BaseRepository):
    collection_name = "revoked_tokens"

    def __init__(self, db: AsyncDatabase):
        super().__init__(db)

    async def revoke_token(self, jti: str, expires_at: datetime) -> None:
        await self.collection.update_one(
            {"jti": jti},
            {"$set": {"jti": jti, "expires_at": expires_at}},
            upsert=True,
        )

    async def is_revoked(self, jti: str) -> bool:
        doc = await self.collection.find_one({"jti": jti})
        return doc is not None
