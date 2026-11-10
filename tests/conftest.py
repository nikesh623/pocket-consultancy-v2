import os
import shutil
from collections.abc import AsyncGenerator
from datetime import UTC, datetime

import pytest
from httpx import ASGITransport, AsyncClient
from pymongo import AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase

from app.core.config import get_settings
from app.core.dependencies import get_db
from app.core.security import create_access_token, hash_password
from app.database.indexes import create_indexes
from app.main import app
from app.models.enums import AccountStatus, UserRole

TEST_DB_NAME = "pocket_consultancy_pytest_db"
TEST_STORAGE_DIR = "storage/test_uploads"


@pytest.fixture
async def mongo_client() -> AsyncGenerator[AsyncMongoClient, None]:
    settings = get_settings()
    client = AsyncMongoClient(
        settings.MONGODB_URI,
        serverSelectionTimeoutMS=settings.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
    )
    yield client
    await client.drop_database(TEST_DB_NAME)
    await client.close()


@pytest.fixture
async def test_db(mongo_client: AsyncMongoClient) -> AsyncGenerator[AsyncDatabase, None]:
    db = mongo_client[TEST_DB_NAME]
    # Drop test collections before each test for total isolation
    collections = await db.list_collection_names()
    for col in collections:
        await db[col].drop()

    # Re-create indexes
    await create_indexes(db)

    # Set active connection in mongo_manager for health and service checks
    from app.database.connection import mongo_manager

    mongo_manager.client = mongo_client
    mongo_manager.db = db

    # Override FastAPI database dependency
    app.dependency_overrides[get_db] = lambda: db

    yield db

    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def setup_test_storage():
    """Ensure clean test uploads directory."""
    os.makedirs(TEST_STORAGE_DIR, exist_ok=True)
    yield
    if os.path.exists(TEST_STORAGE_DIR):
        shutil.rmtree(TEST_STORAGE_DIR, ignore_errors=True)


@pytest.fixture
async def client(test_db: AsyncDatabase) -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac


@pytest.fixture
async def create_user_factory(test_db: AsyncDatabase):
    """Factory helper to seed test users with specific roles and status."""

    async def _create(
        email: str,
        role: UserRole,
        account_status: AccountStatus = AccountStatus.ACTIVE,
        is_active: bool = True,
        password: str = "TestPassword123!",
        full_name: str = "Test User",
    ) -> dict[str, str]:
        now = datetime.now(UTC)
        doc = {
            "email": email.lower(),
            "hashed_password": hash_password(password),
            "full_name": full_name,
            "role": role.value,
            "account_status": account_status.value,
            "is_active": is_active,
            "created_at": now,
            "updated_at": now,
        }
        res = await test_db["users"].insert_one(doc)
        user_id = str(res.inserted_id)
        token = create_access_token(subject=user_id, role=role.value)
        return {
            "id": user_id,
            "email": email,
            "role": role.value,
            "token": token,
            "headers": {"Authorization": f"Bearer {token}"},
        }

    return _create


@pytest.fixture
async def admin_auth(create_user_factory) -> dict[str, str]:
    return await create_user_factory(
        email="test_admin@test.com",
        role=UserRole.ADMIN,
        account_status=AccountStatus.ACTIVE,
        full_name="Admin Tester",
    )


@pytest.fixture
async def counselor_auth(create_user_factory) -> dict[str, str]:
    return await create_user_factory(
        email="test_counselor@test.com",
        role=UserRole.COUNSELOR,
        account_status=AccountStatus.ACTIVE,
        full_name="Counselor Tester",
    )


@pytest.fixture
async def officer_auth(create_user_factory) -> dict[str, str]:
    return await create_user_factory(
        email="test_officer@test.com",
        role=UserRole.DOCUMENTATION_OFFICER,
        account_status=AccountStatus.ACTIVE,
        full_name="Officer Tester",
    )


@pytest.fixture
async def student_auth(create_user_factory) -> dict[str, str]:
    return await create_user_factory(
        email="test_student@test.com",
        role=UserRole.STUDENT,
        account_status=AccountStatus.ACTIVE,
        full_name="Student Tester",
    )
