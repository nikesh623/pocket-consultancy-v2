from pymongo.asynchronous.database import AsyncDatabase

from app.core.exceptions import ConflictError, NotFoundError
from app.repositories.course_repo import CourseRepository
from app.repositories.shortlist_repo import ShortlistRepository
from app.schemas.course import CourseResponse
from app.schemas.shortlist import ShortlistResponse


class ShortlistService:
    def __init__(self, db: AsyncDatabase):
        self.db = db
        self.shortlist_repo = ShortlistRepository(db)
        self.course_repo = CourseRepository(db)

    async def add_course(self, student_id: str, course_id: str) -> ShortlistResponse:
        course = await self.course_repo.find_by_id(course_id)
        if not course:
            raise NotFoundError("Course", course_id)

        already_exists = await self.shortlist_repo.exists(student_id, course_id)
        if already_exists:
            raise ConflictError("Course is already in your shortlist.")

        doc = await self.shortlist_repo.add(student_id, course_id)
        course_resp = CourseResponse.model_validate(course)
        return ShortlistResponse(
            id=str(doc["_id"]),
            student_id=str(student_id),
            course_id=str(course_id),
            course=course_resp,
            created_at=doc["created_at"],
        )

    async def remove_course(self, student_id: str, course_id: str) -> bool:
        removed = await self.shortlist_repo.remove(student_id, course_id)
        if not removed:
            raise NotFoundError("Shortlisted course entry", course_id)
        return True

    async def list_shortlist(self, student_id: str) -> list[ShortlistResponse]:
        items = await self.shortlist_repo.list_by_student(student_id)
        results: list[ShortlistResponse] = []
        for item in items:
            course_doc = await self.course_repo.find_by_id(item["course_id"])
            course_schema = CourseResponse.model_validate(course_doc) if course_doc else None
            results.append(
                ShortlistResponse(
                    id=str(item["_id"]),
                    student_id=item["student_id"],
                    course_id=item["course_id"],
                    course=course_schema,
                    created_at=item["created_at"],
                )
            )
        return results
