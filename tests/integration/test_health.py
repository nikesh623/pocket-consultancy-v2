import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_endpoint(client: AsyncClient):
    resp = await client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["project"] == "Pocket Consultancy V2"
    assert data["status"] == "operational"
    assert data["documentation"]["swagger_ui"] == "/docs"


@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "database" in data
    assert "storage" in data


@pytest.mark.asyncio
async def test_docs_and_openapi(client: AsyncClient):
    docs_resp = await client.get("/docs")
    assert docs_resp.status_code == 200

    redoc_resp = await client.get("/redoc")
    assert redoc_resp.status_code == 200

    openapi_resp = await client.get("/openapi.json")
    assert openapi_resp.status_code == 200
    spec = openapi_resp.json()
    assert spec["info"]["title"] == "Pocket Consultancy V2"
