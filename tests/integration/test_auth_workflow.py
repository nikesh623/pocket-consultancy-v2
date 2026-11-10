import pytest
from httpx import AsyncClient

from app.models.enums import AccountStatus, UserRole


@pytest.mark.asyncio
async def test_auth_and_approval_workflow(client: AsyncClient, admin_auth):
    # 1. Public student registration
    reg_payload = {
        "email": "alice.student@example.com",
        "password": "StudentPassword123!",
        "full_name": "Alice Cooper",
        "phone_number": "+1-555-9876",
    }
    reg_resp = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201
    reg_data = reg_resp.json()
    assert reg_data["email"] == "alice.student@example.com"
    assert reg_data["role"] == UserRole.STUDENT.value
    assert reg_data["account_status"] == AccountStatus.PENDING.value
    user_id = reg_data["id"]

    # 2. Duplicate registration rejected
    dup_resp = await client.post("/api/v1/auth/register", json=reg_payload)
    assert dup_resp.status_code == 409
    assert "already exists" in dup_resp.json()["error"]["message"]

    # 3. Attempt login while account is pending -> must fail with 401
    login_payload = {
        "email": "alice.student@example.com",
        "password": "StudentPassword123!",
    }
    pending_login = await client.post("/api/v1/auth/login", json=login_payload)
    assert pending_login.status_code == 401
    assert "pending administrator approval" in pending_login.json()["error"]["message"]

    # 4. Admin approves student account
    approve_payload = {"account_status": AccountStatus.ACTIVE.value}
    approve_resp = await client.patch(
        f"/api/v1/users/{user_id}/status",
        headers=admin_auth["headers"],
        json=approve_payload,
    )
    assert approve_resp.status_code == 200
    assert approve_resp.json()["account_status"] == AccountStatus.ACTIVE.value

    # 5. Student logs in after approval
    active_login = await client.post("/api/v1/auth/login", json=login_payload)
    assert active_login.status_code == 200
    tokens = active_login.json()
    assert "access_token" in tokens
    assert "refresh_token" in tokens
    access_token = tokens["access_token"]
    refresh_token = tokens["refresh_token"]

    # 6. Current user endpoint /auth/me
    me_resp = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["email"] == "alice.student@example.com"
    assert me_data["role"] == UserRole.STUDENT.value

    # 7. Token refresh rotation
    ref_resp = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert ref_resp.status_code == 200
    new_tokens = ref_resp.json()
    assert "access_token" in new_tokens
    new_access_token = new_tokens["access_token"]
    new_refresh_token = new_tokens["refresh_token"]

    # 8. Old refresh token cannot be reused (revoked)
    reuse_resp = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert reuse_resp.status_code == 401

    # 9. Logout
    logout_resp = await client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": new_refresh_token},
    )
    assert logout_resp.status_code == 200

    # 10. Role-based enforcement: Student cannot access Admin endpoints
    forbidden_resp = await client.get(
        "/api/v1/users/",
        headers={"Authorization": f"Bearer {new_access_token}"},
    )
    assert forbidden_resp.status_code == 403
