import pytest

from app import main


@pytest.mark.asyncio
async def test_lifespan_fails_when_database_connection_fails(monkeypatch: pytest.MonkeyPatch) -> None:
    closed = False

    async def fail_to_connect() -> None:
        raise RuntimeError("database unavailable")

    async def close_connection() -> None:
        nonlocal closed
        closed = True

    monkeypatch.setattr(main, "connect_to_mongo", fail_to_connect)
    monkeypatch.setattr(main, "close_mongo_connection", close_connection)

    with pytest.raises(RuntimeError, match="database unavailable"):
        async with main.lifespan(main.app):
            pytest.fail("Application lifespan must not start without MongoDB.")

    assert closed
