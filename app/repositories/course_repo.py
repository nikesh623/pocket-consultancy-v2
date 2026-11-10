from typing import Any

from pymongo import ASCENDING
from pymongo.asynchronous.database import AsyncDatabase

from app.models.enums import StudyLevel
from app.repositories.base import BaseRepository


class CourseRepository(BaseRepository):
    collection_name = "courses"

    def __init__(self, db: AsyncDatabase):
        super().__init__(db)

    async def list_courses(
        self,
        country_id: str | None = None,
        university_id: str | None = None,
        study_level: StudyLevel | None = None,
        max_fee: float | None = None,
        active_only: bool = True,
        sort_by: str = "name",
        sort_order: int = ASCENDING,
        skip: int = 0,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        filter_dict: dict[str, Any] = {}
        if active_only:
            filter_dict["is_active"] = True
        if country_id:
            filter_dict["country_id"] = str(country_id)
        if university_id:
            filter_dict["university_id"] = str(university_id)
        if study_level:
            filter_dict["study_level"] = study_level.value
        if max_fee is not None:
            filter_dict["tuition_fee"] = {"$lte": max_fee}

        sort_field = sort_by if sort_by in ["name", "tuition_fee", "created_at"] else "name"
        return await self.find_all(
            filter_query=filter_dict,
            sort=[(sort_field, sort_order)],
            skip=skip,
            limit=limit,
        )

    async def count_courses(
        self,
        country_id: str | None = None,
        university_id: str | None = None,
        study_level: StudyLevel | None = None,
        max_fee: float | None = None,
        active_only: bool = True,
    ) -> int:
        filter_dict: dict[str, Any] = {}
        if active_only:
            filter_dict["is_active"] = True
        if country_id:
            filter_dict["country_id"] = str(country_id)
        if university_id:
            filter_dict["university_id"] = str(university_id)
        if study_level:
            filter_dict["study_level"] = study_level.value
        if max_fee is not None:
            filter_dict["tuition_fee"] = {"$lte": max_fee}
        return await self.count(filter_dict)
