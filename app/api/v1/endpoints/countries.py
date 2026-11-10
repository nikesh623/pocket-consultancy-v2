from typing import Any

from fastapi import APIRouter, Depends, Query, status
from pymongo.asynchronous.database import AsyncDatabase

from app.core.dependencies import get_current_user, get_db, require_admin
from app.schemas.country import (
    CountryCreate,
    CountryListResponse,
    CountryResponse,
    CountryUpdate,
)
from app.services.destination_service import DestinationService

router = APIRouter(prefix="/countries", tags=["Countries"])


@router.get(
    "/",
    response_model=CountryListResponse,
    summary="List study destination countries",
)
async def list_countries(
    active_only: bool = Query(True, description="Filter only active countries"),
    db: AsyncDatabase = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> Any:
    dest_service = DestinationService(db)
    items = await dest_service.list_countries(active_only=active_only)
    return {
        "items": [CountryResponse.model_validate(c) for c in items],
        "total": len(items),
    }


@router.get(
    "/{country_id}",
    response_model=CountryResponse,
    summary="Get country details",
)
async def get_country(
    country_id: str,
    db: AsyncDatabase = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> Any:
    dest_service = DestinationService(db)
    country = await dest_service.get_country(country_id)
    return CountryResponse.model_validate(country)


@router.post(
    "/",
    response_model=CountryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Admin create country",
)
async def create_country(
    data: CountryCreate,
    current_admin: dict[str, Any] = Depends(require_admin),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    dest_service = DestinationService(db)
    country = await dest_service.create_country(data)
    return CountryResponse.model_validate(country)


@router.patch(
    "/{country_id}",
    response_model=CountryResponse,
    summary="Admin update country",
)
async def update_country(
    country_id: str,
    data: CountryUpdate,
    current_admin: dict[str, Any] = Depends(require_admin),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    dest_service = DestinationService(db)
    country = await dest_service.update_country(country_id, data)
    return CountryResponse.model_validate(country)
