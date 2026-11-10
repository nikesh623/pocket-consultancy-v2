from typing import Any

from fastapi import APIRouter, Depends, Query, status
from pymongo.asynchronous.database import AsyncDatabase

from app.core.dependencies import get_current_user, get_db, require_student
from app.models.enums import ApplicationStatus
from app.schemas.application import (
    ApplicationCreate,
    ApplicationDetailResponse,
    ApplicationHistoryResponse,
    ApplicationListResponse,
    ApplicationResponse,
    ApplicationStatusTransitionRequest,
)
from app.schemas.course import CourseResponse
from app.services.application_service import ApplicationService

router = APIRouter(prefix="/applications", tags=["Application Management"])


@router.post(
    "/",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Student submit application",
    description="Submits an application for a course. Generates a unique reference (format: PC-YYYY-XXXXXXXX) and records initial history.",
)
async def submit_application(
    data: ApplicationCreate,
    current_user: dict[str, Any] = Depends(require_student),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    app_service = ApplicationService(db)
    app = await app_service.submit_application(str(current_user["_id"]), data)
    return ApplicationResponse.model_validate(app)


@router.get(
    "/",
    response_model=ApplicationListResponse,
    summary="List applications",
    description="Students view their own applications. Staff and administrators view all applications with optional status filtering.",
)
async def list_applications(
    status: ApplicationStatus | None = Query(None, description="Filter by status"),
    student_id: str | None = Query(None, description="Filter by student (staff only)"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    app_service = ApplicationService(db)
    result = await app_service.list_applications(
        requesting_user=current_user,
        student_id=student_id,
        status=status,
        page=page,
        size=size,
    )
    return {
        "items": [ApplicationResponse.model_validate(a) for a in result["items"]],
        "total": result["total"],
        "page": result["page"],
        "size": result["size"],
    }


@router.get(
    "/{application_id}",
    response_model=ApplicationDetailResponse,
    summary="Get application details and status audit history",
)
async def get_application_detail(
    application_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    app_service = ApplicationService(db)
    detail = await app_service.get_application_detail(application_id, current_user)
    return {
        "application": ApplicationResponse.model_validate(detail["application"]),
        "history": [ApplicationHistoryResponse.model_validate(h) for h in detail["history"]],
        "course": CourseResponse.model_validate(detail["course"]) if detail.get("course") else None,
    }


@router.post(
    "/{application_id}/transition",
    response_model=ApplicationResponse,
    summary="Transition application status",
    description="Authorized status change. Students may only withdraw. Counselors and Administrators can progress statuses according to allowed state transitions.",
)
async def transition_application_status(
    application_id: str,
    data: ApplicationStatusTransitionRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    app_service = ApplicationService(db)
    updated = await app_service.transition_status(
        application_id=application_id,
        transition_data=data,
        requesting_user=current_user,
    )
    return ApplicationResponse.model_validate(updated)
