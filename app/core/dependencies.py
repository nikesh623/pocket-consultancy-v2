from collections.abc import Callable
from typing import Any

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pymongo.asynchronous.database import AsyncDatabase

from app.core.exceptions import AuthenticationError, AuthorizationError
from app.core.security import decode_token
from app.database.connection import get_database
from app.models.enums import AccountStatus, UserRole
from app.repositories.user_repo import UserRepository

bearer_scheme = HTTPBearer(auto_error=False)


async def get_db() -> AsyncDatabase:
    """Dependency that yields the active AsyncDatabase."""
    return get_database()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncDatabase = Depends(get_db),
) -> dict[str, Any]:
    """Validate Bearer access token and return active authenticated user document."""
    if not credentials or not credentials.credentials:
        raise AuthenticationError("Authentication token is missing.")

    try:
        payload = decode_token(credentials.credentials)
    except jwt.ExpiredSignatureError:
        raise AuthenticationError("Access token has expired.") from None
    except jwt.PyJWTError:
        raise AuthenticationError("Invalid access token.") from None

    if payload.get("type") != "access":
        raise AuthenticationError("Token is not an access token.")

    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationError("Invalid token subject.")

    user_repo = UserRepository(db)
    user = await user_repo.find_by_id(user_id)
    if not user:
        raise AuthenticationError("User not found.")

    if user.get("account_status") != AccountStatus.ACTIVE.value or not user.get("is_active", False):
        raise AuthenticationError("Account is not active or has been deactivated.")

    return user


def require_roles(allowed_roles: list[UserRole]) -> Callable:
    """Dependency factory enforcing server-side role-based access control (RBAC)."""

    async def role_checker(
        current_user: dict[str, Any] = Depends(get_current_user),
    ) -> dict[str, Any]:
        user_role = current_user.get("role")
        allowed_str = [r.value for r in allowed_roles]
        if user_role not in allowed_str:
            raise AuthorizationError(
                f"Access forbidden: Role '{user_role}' does not possess required privileges."
            )
        return current_user

    return role_checker


# Role shortcut dependencies
require_admin = require_roles([UserRole.ADMIN])
require_counselor = require_roles([UserRole.COUNSELOR, UserRole.ADMIN])
require_documentation_officer = require_roles([UserRole.DOCUMENTATION_OFFICER, UserRole.ADMIN])
require_student = require_roles([UserRole.STUDENT])
require_staff = require_roles([UserRole.COUNSELOR, UserRole.DOCUMENTATION_OFFICER, UserRole.ADMIN])
