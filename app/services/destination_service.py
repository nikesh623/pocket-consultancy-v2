from typing import Any

from pymongo.asynchronous.database import AsyncDatabase

from app.core.exceptions import ConflictError, NotFoundError
from app.models.enums import StudyLevel
from app.repositories.country_repo import CountryRepository
from app.repositories.course_repo import CourseRepository
from app.repositories.university_repo import UniversityRepository
from app.schemas.country import CountryCreate, CountryUpdate
from app.schemas.course import CourseCreate, CourseUpdate
from app.schemas.university import UniversityCreate, UniversityUpdate


class DestinationService:
    def __init__(self, db: AsyncDatabase):
        self.db = db
        self.country_repo = CountryRepository(db)
        self.univ_repo = UniversityRepository(db)
        self.course_repo = CourseRepository(db)

    # Country Operations
    async def create_country(self, data: CountryCreate) -> dict[str, Any]:
        existing = await self.country_repo.find_by_code(data.code)
        if existing:
            raise ConflictError(f"Country with code '{data.code}' already exists.")

        doc = data.model_dump()
        doc["code"] = doc["code"].upper().strip()
        country_id = await self.country_repo.insert_one(doc)
        doc["_id"] = country_id
        return doc

    async def get_country(self, country_id: str) -> dict[str, Any]:
        country = await self.country_repo.find_by_id(country_id)
        if not country:
            raise NotFoundError("Country", country_id)
        return country

    async def list_countries(self, active_only: bool = True) -> list[dict[str, Any]]:
        return await self.country_repo.list_countries(active_only=active_only)

    async def update_country(self, country_id: str, data: CountryUpdate) -> dict[str, Any]:
        await self.get_country(country_id)
        update_data = {k: v for k, v in data.model_dump().items() if v is not None}
        if "code" in update_data:
            update_data["code"] = update_data["code"].upper().strip()
        await self.country_repo.update_by_id(country_id, update_data)
        return await self.get_country(country_id)

    # University Operations
    async def create_university(self, data: UniversityCreate) -> dict[str, Any]:
        await self.get_country(data.country_id)
        doc = data.model_dump()
        univ_id = await self.univ_repo.insert_one(doc)
        doc["_id"] = univ_id
        return doc

    async def get_university(self, university_id: str) -> dict[str, Any]:
        univ = await self.univ_repo.find_by_id(university_id)
        if not univ:
            raise NotFoundError("University", university_id)
        return univ

    async def list_universities(
        self,
        country_id: str | None = None,
        active_only: bool = True,
        page: int = 1,
        size: int = 50,
    ) -> dict[str, Any]:
        skip = (page - 1) * size
        items = await self.univ_repo.list_universities(
            country_id=country_id, active_only=active_only, skip=skip, limit=size
        )
        total = await self.univ_repo.count_universities(
            country_id=country_id, active_only=active_only
        )
        return {"items": items, "total": total, "page": page, "size": size}

    async def update_university(self, university_id: str, data: UniversityUpdate) -> dict[str, Any]:
        await self.get_university(university_id)
        update_data = {k: v for k, v in data.model_dump().items() if v is not None}
        if "country_id" in update_data:
            await self.get_country(update_data["country_id"])
        await self.univ_repo.update_by_id(university_id, update_data)
        return await self.get_university(university_id)

    # Course Operations
    async def create_course(self, data: CourseCreate) -> dict[str, Any]:
        await self.get_country(data.country_id)
        await self.get_university(data.university_id)
        doc = data.model_dump()
        doc["study_level"] = (
            doc["study_level"].value
            if hasattr(doc["study_level"], "value")
            else str(doc["study_level"])
        )
        course_id = await self.course_repo.insert_one(doc)
        doc["_id"] = course_id
        return doc

    async def get_course(self, course_id: str) -> dict[str, Any]:
        course = await self.course_repo.find_by_id(course_id)
        if not course:
            raise NotFoundError("Course", course_id)
        return course

    async def list_courses(
        self,
        country_id: str | None = None,
        university_id: str | None = None,
        study_level: StudyLevel | None = None,
        max_fee: float | None = None,
        active_only: bool = True,
        sort_by: str = "name",
        sort_order: int = 1,
        page: int = 1,
        size: int = 50,
    ) -> dict[str, Any]:
        skip = (page - 1) * size
        items = await self.course_repo.list_courses(
            country_id=country_id,
            university_id=university_id,
            study_level=study_level,
            max_fee=max_fee,
            active_only=active_only,
            sort_by=sort_by,
            sort_order=sort_order,
            skip=skip,
            limit=size,
        )
        total = await self.course_repo.count_courses(
            country_id=country_id,
            university_id=university_id,
            study_level=study_level,
            max_fee=max_fee,
            active_only=active_only,
        )
        return {"items": items, "total": total, "page": page, "size": size}

    async def update_course(self, course_id: str, data: CourseUpdate) -> dict[str, Any]:
        await self.get_course(course_id)
        update_data = {k: v for k, v in data.model_dump().items() if v is not None}
        if "country_id" in update_data:
            await self.get_country(update_data["country_id"])
        if "university_id" in update_data:
            await self.get_university(update_data["university_id"])
        if "study_level" in update_data and hasattr(update_data["study_level"], "value"):
            update_data["study_level"] = update_data["study_level"].value

        await self.course_repo.update_by_id(course_id, update_data)
        return await self.get_course(course_id)
