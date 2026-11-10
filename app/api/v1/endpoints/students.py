from typing import Any

from fastapi import APIRouter, Body, Depends, status
from pymongo.asynchronous.database import AsyncDatabase

from app.core.dependencies import (
    get_db,
    require_admin,
    require_counselor,
    require_student,
)
from app.schemas.counselor_note import (
    CounselorNoteCreate,
    CounselorNoteListResponse,
    CounselorNoteResponse,
)
from app.schemas.matching import CourseMatchResponse
from app.schemas.shortlist import (
    ShortlistCreate,
    ShortlistListResponse,
    ShortlistResponse,
)
from app.schemas.student import (
    StudentProfileCreate,
    StudentProfileResponse,
    StudentProfileUpdate,
)
from app.services.matching_service import MatchingService
from app.services.shortlist_service import ShortlistService
from app.services.student_service import StudentService

router = APIRouter(prefix="/students", tags=["Students & Counseling"])


# --- Student Self-Service Endpoints ---


@router.get(
    "/me/profile",
    response_model=StudentProfileResponse,
    summary="Student get own profile",
)
async def get_my_profile(
    current_user: dict[str, Any] = Depends(require_student),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    student_service = StudentService(db)
    profile = await student_service.get_profile(str(current_user["_id"]), current_user)
    return StudentProfileResponse.model_validate(profile)


@router.post(
    "/me/profile",
    response_model=StudentProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Student create/upsert profile",
)
async def create_or_upsert_my_profile(
    data: StudentProfileCreate,
    current_user: dict[str, Any] = Depends(require_student),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    student_service = StudentService(db)
    profile = await student_service.get_or_create_profile(str(current_user["_id"]), data)
    return StudentProfileResponse.model_validate(profile)


@router.patch(
    "/me/profile",
    response_model=StudentProfileResponse,
    summary="Student update profile",
)
async def update_my_profile(
    data: StudentProfileUpdate,
    current_user: dict[str, Any] = Depends(require_student),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    student_service = StudentService(db)
    profile = await student_service.update_profile(str(current_user["_id"]), data)
    return StudentProfileResponse.model_validate(profile)


@router.get(
    "/me/matches",
    response_model=CourseMatchResponse,
    summary="Rule-based course recommendation",
    description="Evaluates student academic profile against active courses using transparent deterministic business rules.",
)
async def get_course_matches(
    current_user: dict[str, Any] = Depends(require_student),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    matching_service = MatchingService(db)
    return await matching_service.match_courses_for_student(str(current_user["_id"]))


@router.get(
    "/me/shortlist",
    response_model=ShortlistListResponse,
    summary="Student list shortlisted courses",
)
async def list_my_shortlist(
    current_user: dict[str, Any] = Depends(require_student),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    shortlist_service = ShortlistService(db)
    items = await shortlist_service.list_shortlist(str(current_user["_id"]))
    return {"items": items, "total": len(items)}


@router.post(
    "/me/shortlist",
    response_model=ShortlistResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Student add course to shortlist",
)
async def add_to_shortlist(
    data: ShortlistCreate,
    current_user: dict[str, Any] = Depends(require_student),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    shortlist_service = ShortlistService(db)
    return await shortlist_service.add_course(str(current_user["_id"]), data.course_id)


@router.delete(
    "/me/shortlist/{course_id}",
    status_code=status.HTTP_200_OK,
    summary="Student remove course from shortlist",
)
async def remove_from_shortlist(
    course_id: str,
    current_user: dict[str, Any] = Depends(require_student),
    db: AsyncDatabase = Depends(get_db),
) -> dict[str, str]:
    shortlist_service = ShortlistService(db)
    await shortlist_service.remove_course(str(current_user["_id"]), course_id)
    return {"message": "Course removed from shortlist."}


# --- Counselor & Admin Student Management Endpoints ---


@router.get(
    "/counselor/assigned-students",
    response_model=list[StudentProfileResponse],
    summary="Counselor get assigned students",
)
async def get_assigned_students(
    current_user: dict[str, Any] = Depends(require_counselor),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    student_service = StudentService(db)
    students = await student_service.list_assigned_students(str(current_user["_id"]))
    return [StudentProfileResponse.model_validate(s) for s in students]


@router.post(
    "/counselor/notes",
    response_model=CounselorNoteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Counselor add private note for student",
)
async def create_counselor_note(
    data: CounselorNoteCreate,
    current_user: dict[str, Any] = Depends(require_counselor),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    student_service = StudentService(db)
    note = await student_service.add_counselor_note(str(current_user["_id"]), data)
    return CounselorNoteResponse.model_validate(note)


@router.get(
    "/counselor/notes/{student_id}",
    response_model=CounselorNoteListResponse,
    summary="Counselor view private notes for student",
)
async def list_counselor_notes(
    student_id: str,
    current_user: dict[str, Any] = Depends(require_counselor),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    student_service = StudentService(db)
    notes = await student_service.list_counselor_notes(
        student_id=student_id,
        counselor_id=str(current_user["_id"]),
        requesting_user=current_user,
    )
    return {
        "items": [CounselorNoteResponse.model_validate(n) for n in notes],
        "total": len(notes),
    }


@router.post(
    "/assign-counselor",
    status_code=status.HTTP_200_OK,
    summary="Admin assign counselor to student",
)
async def assign_counselor_to_student(
    student_user_id: str = Body(..., embed=True),
    counselor_user_id: str = Body(..., embed=True),
    current_admin: dict[str, Any] = Depends(require_admin),
    db: AsyncDatabase = Depends(get_db),
) -> dict[str, str]:
    student_service = StudentService(db)
    await student_service.assign_counselor(student_user_id, counselor_user_id)
    return {"message": "Counselor successfully assigned to student."}


@router.get(
    "/{user_id}/profile",
    response_model=StudentProfileResponse,
    summary="Counselor or Admin view student profile",
)
async def get_student_profile(
    user_id: str,
    current_user: dict[str, Any] = Depends(require_counselor),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    student_service = StudentService(db)
    profile = await student_service.get_profile(user_id, current_user)
    return StudentProfileResponse.model_validate(profile)
