from typing import Any

from pymongo.asynchronous.database import AsyncDatabase

from app.core.exceptions import AuthorizationError, NotFoundError
from app.models.enums import UserRole
from app.repositories.counselor_note_repo import CounselorNoteRepository
from app.repositories.student_repo import StudentRepository
from app.schemas.counselor_note import CounselorNoteCreate
from app.schemas.student import StudentProfileCreate, StudentProfileUpdate


class StudentService:
    def __init__(self, db: AsyncDatabase):
        self.db = db
        self.student_repo = StudentRepository(db)
        self.note_repo = CounselorNoteRepository(db)

    async def get_or_create_profile(
        self, user_id: str, profile_in: StudentProfileCreate
    ) -> dict[str, Any]:
        data = profile_in.model_dump()
        if data.get("date_of_birth"):
            data["date_of_birth"] = str(data["date_of_birth"])
        return await self.student_repo.upsert_profile(user_id, data)

    async def update_profile(
        self, user_id: str, profile_update: StudentProfileUpdate
    ) -> dict[str, Any]:
        update_data = {k: v for k, v in profile_update.model_dump().items() if v is not None}
        if "date_of_birth" in update_data and update_data["date_of_birth"]:
            update_data["date_of_birth"] = str(update_data["date_of_birth"])
        return await self.student_repo.upsert_profile(user_id, update_data)

    async def get_profile(
        self, target_user_id: str, requesting_user: dict[str, Any]
    ) -> dict[str, Any]:
        req_role = requesting_user.get("role")
        req_id = str(requesting_user.get("_id"))

        # Role check: student can only view own profile
        if req_role == UserRole.STUDENT.value and req_id != target_user_id:
            raise AuthorizationError("Students cannot view other student profiles.")

        profile = await self.student_repo.get_by_user_id(target_user_id)
        if not profile:
            raise NotFoundError("Student Profile", target_user_id)
        return profile

    async def assign_counselor(self, student_user_id: str, counselor_id: str | None) -> bool:
        return await self.student_repo.assign_counselor(student_user_id, counselor_id)

    async def list_assigned_students(self, counselor_id: str) -> list[dict[str, Any]]:
        return await self.student_repo.list_assigned_students(counselor_id)

    # Counselor Notes
    async def add_counselor_note(
        self, counselor_id: str, data: CounselorNoteCreate
    ) -> dict[str, Any]:
        doc = {
            "counselor_id": str(counselor_id),
            "student_id": str(data.student_id),
            "title": data.title.strip(),
            "content": data.content.strip(),
        }
        note_id = await self.note_repo.insert_one(doc)
        doc["_id"] = note_id
        return doc

    async def list_counselor_notes(
        self, student_id: str, counselor_id: str, requesting_user: dict[str, Any]
    ) -> list[dict[str, Any]]:
        req_role = requesting_user.get("role")
        req_id = str(requesting_user.get("_id"))

        if req_role == UserRole.STUDENT.value:
            raise AuthorizationError("Students do not have access to private counselor notes.")
        if req_role == UserRole.COUNSELOR.value and req_id != counselor_id:
            raise AuthorizationError("Counselors can only access their own student notes.")

        return await self.note_repo.list_by_student(
            student_id=student_id, counselor_id=counselor_id
        )
