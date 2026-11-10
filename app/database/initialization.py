import logging
from datetime import UTC, datetime

from pymongo.asynchronous.database import AsyncDatabase

from app.core.config import get_settings
from app.core.security import hash_password
from app.database.indexes import create_indexes
from app.models.enums import AccountStatus, UserRole

logger = logging.getLogger("pocket_consultancy.database")


async def init_database(db: AsyncDatabase) -> None:
    """Initialize collections, create indexes, and seed initial administrator if needed."""
    await create_indexes(db)

    settings = get_settings()
    users_col = db["users"]

    # Check if an administrator already exists
    admin = await users_col.find_one({"role": UserRole.ADMIN.value})
    if not admin and settings.ADMIN_EMAIL:
        logger.info(
            "No administrator found. Seeding initial administrator account: %s",
            settings.ADMIN_EMAIL,
        )
        now = datetime.now(UTC)
        admin_doc = {
            "email": settings.ADMIN_EMAIL.lower().strip(),
            "hashed_password": hash_password(settings.ADMIN_PASSWORD),
            "full_name": settings.ADMIN_FULL_NAME,
            "role": UserRole.ADMIN.value,
            "account_status": AccountStatus.ACTIVE.value,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }
        await users_col.insert_one(admin_doc)
        logger.info("Administrator account seeded successfully.")
