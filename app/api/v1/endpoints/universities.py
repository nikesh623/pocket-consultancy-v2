from typing import Any

from fastapi import APIRouter, Depends, Query, status
from pymongo.asynchronous.database import AsyncDatabase

from app.core.dependencies import get_current_user, get_db, require_admin
from app.schemas.university import (
    UniversityCreate,
    UniversityListResponse,
    UniversityResponse,
    UniversityUpdate,
)
from app.services.destination_service import DestinationService

router = APIRouter(prefix="/universities", tags=["Universities"])


@router.get(
    "/",
    response_model=UniversityListResponse,
    summary="List universities",
)
async def list_universities(
    country_id: str | None = Query(None, description="Filter by country ID"),
    active_only: bool = Query(True, description="Filter only active universities"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    db: AsyncDatabase = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> Any:
    dest_service = DestinationService(db)
    result = await dest_service.list_universities(
        country_id=country_id, active_only=active_only, page=page, size=size
    )
    return {
        "items": [UniversityResponse.model_validate(u) for u in result["items"]],
        "total": result["total"],
        "page": result["page"],
        "size": result["size"],
    }


@router.get(
    "/{university_id}",
    response_model=UniversityResponse,
    summary="Get university details",
)
async def get_university(
    university_id: str,
    db: AsyncDatabase = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> Any:
    dest_service = DestinationService(db)
    univ = await dest_service.get_university(university_id)
    return UniversityResponse.model_validate(univ)


@router.post(
    "/",
    response_model=UniversityResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Admin create university",
)
async def create_university(
    data: UniversityCreate,
    current_admin: dict[str, Any] = Depends(require_admin),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    dest_service = DestinationService(db)
    univ = await dest_service.create_university(data)
    return UniversityResponse.model_validate(univ)


@router.patch(
    "/{university_id}",
    response_model=UniversityResponse,
    summary="Admin update university",
)
async def update_university(
    university_id: str,
    data: UniversityUpdate,
    current_admin: dict[str, Any] = Depends(require_admin),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    dest_service = DestinationService(db)
    univ = await dest_service.update_university(university_id, data)
    return UniversityResponse.model_validate(univ)
