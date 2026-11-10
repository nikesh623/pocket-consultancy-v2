from typing import Any

from pydantic import BaseModel

from app.models.enums import MatchStatus
from app.schemas.course import CourseResponse


class CourseMatchResult(BaseModel):
    course: CourseResponse
    match_status: MatchStatus
    score_match: bool
    level_match: bool
    country_match: bool
    budget_match: bool
    explanation: str
    reasons: list[str]


class CourseMatchResponse(BaseModel):
    student_id: str
    student_criteria: dict[str, Any]
    results: list[CourseMatchResult]
    total_evaluated: int
    matches_count: int
    needs_review_count: int
    insufficient_data_count: int
