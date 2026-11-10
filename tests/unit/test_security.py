from datetime import timedelta

import jwt
import pytest

from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)

settings = get_settings()


def test_password_hashing():
    pwd = "MySecretPassword123!"
    h1 = hash_password(pwd)
    h2 = hash_password(pwd)

    # Argon2 uses random salt, hashes must differ
    assert h1 != h2
    assert verify_password(pwd, h1) is True
    assert verify_password(pwd, h2) is True
    assert verify_password("WrongPassword!", h1) is False


def test_token_creation_and_decoding():
    user_id = "user-12345"
    role = "student"

    access_token = create_access_token(subject=user_id, role=role)
    payload = decode_token(access_token)

    assert payload["sub"] == user_id
    assert payload["role"] == role
    assert payload["type"] == "access"
    assert "jti" in payload
    assert "exp" in payload

    refresh_token = create_refresh_token(subject=user_id, role=role)
    r_payload = decode_token(refresh_token)
    assert r_payload["sub"] == user_id
    assert r_payload["type"] == "refresh"


def test_expired_token():
    user_id = "user-exp"
    # Create token already expired in the past
    token = create_access_token(
        subject=user_id, role="student", expires_delta=timedelta(seconds=-10)
    )

    with pytest.raises(jwt.ExpiredSignatureError):
        decode_token(token)
