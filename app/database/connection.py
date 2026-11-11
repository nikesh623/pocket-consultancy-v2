import logging

from pymongo import AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase

from app.core.config import get_settings

logger = logging.getLogger("pocket_consultancy.database")


class MongoManager:
    client: AsyncMongoClient | None = None
    db: AsyncDatabase | None = None


mongo_manager = MongoManager()


async def connect_to_mongo(uri: str | None = None, db_name: str | None = None) -> None:
    """Initialize AsyncMongoClient connection pool."""
    settings = get_settings()
    mongo_uri = uri or settings.MONGODB_URI
    database_name = db_name or settings.MONGODB_DB_NAME

    logger.info(
        "Connecting to MongoDB at %s (database: %s)...", mongo_uri.split("@")[-1], database_name
    )

    mongo_manager.client = AsyncMongoClient(
        mongo_uri,
        minPoolSize=settings.MONGODB_MIN_POOL_SIZE,
        maxPoolSize=settings.MONGODB_MAX_POOL_SIZE,
        serverSelectionTimeoutMS=settings.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
    )
    mongo_manager.db = mongo_manager.client[database_name]

    await mongo_manager.client.admin.command("ping")
    logger.info("Successfully connected to MongoDB.")


async def close_mongo_connection() -> None:
    """Close AsyncMongoClient connection pool."""
    if mongo_manager.client is not None:
        logger.info("Closing MongoDB connection...")
        await mongo_manager.client.close()
        mongo_manager.client = None
        mongo_manager.db = None
        logger.info("MongoDB connection closed.")


def get_database() -> AsyncDatabase:
    """Retrieve active AsyncDatabase instance."""
    if mongo_manager.db is None:
        raise RuntimeError("MongoDB connection is not initialized. Call connect_to_mongo() first.")
    return mongo_manager.db


def get_client() -> AsyncMongoClient:
    """Retrieve active AsyncMongoClient instance."""
    if mongo_manager.client is None:
        raise RuntimeError("MongoDB connection is not initialized. Call connect_to_mongo() first.")
    return mongo_manager.client
