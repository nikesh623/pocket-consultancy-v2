from typing import Any

from fastapi import APIRouter, Depends, Query, status
from pymongo.asynchronous.database import AsyncDatabase

from app.core.dependencies import get_current_user, get_db, require_admin
from app.models.enums import StudyLevel
from app.schemas.course import (
    CourseCreate,
    CourseListResponse,
    CourseResponse,
    CourseUpdate,
)
from app.services.destination_service import DestinationService

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.get(
    "/",
    response_model=CourseListResponse,
    summary="List courses",
    description="List courses with filtering by country, university, study level, max tuition fee, and pagination.",
)
async def list_courses(
    country_id: str | None = Query(None, description="Filter by country ID"),
    university_id: str | None = Query(None, description="Filter by university ID"),
    study_level: StudyLevel | None = Query(None, description="Filter by study level"),
    max_fee: float | None = Query(None, description="Filter by maximum tuition fee"),
    active_only: bool = Query(True, description="Filter only active courses"),
    sort_by: str = Query("name", pattern="^(name|tuition_fee|created_at)$"),
    sort_order: int = Query(1, description="1 for ascending, -1 for descending"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    db: AsyncDatabase = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> Any:
    dest_service = DestinationService(db)
    result = await dest_service.list_courses(
        country_id=country_id,
        university_id=university_id,
        study_level=study_level,
        max_fee=max_fee,
        active_only=active_only,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        size=size,
    )
    return {
        "items": [CourseResponse.model_validate(c) for c in result["items"]],
        "total": result["total"],
        "page": result["page"],
        "size": result["size"],
    }


@router.get(
    "/{course_id}",
    response_model=CourseResponse,
    summary="Get course details",
)
async def get_course(
    course_id: str,
    db: AsyncDatabase = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> Any:
    dest_service = DestinationService(db)
    course = await dest_service.get_course(course_id)
    return CourseResponse.model_validate(course)


@router.post(
    "/",
    response_model=CourseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Admin create course",
)
async def create_course(
    data: CourseCreate,
    current_admin: dict[str, Any] = Depends(require_admin),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    dest_service = DestinationService(db)
    course = await dest_service.create_course(data)
    return CourseResponse.model_validate(course)


@router.patch(
    "/{course_id}",
    response_model=CourseResponse,
    summary="Admin update course",
)
async def update_course(
    course_id: str,
    data: CourseUpdate,
    current_admin: dict[str, Any] = Depends(require_admin),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    dest_service = DestinationService(db)
    course = await dest_service.update_course(course_id, data)
    return CourseResponse.model_validate(course)
