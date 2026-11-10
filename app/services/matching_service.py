from pymongo.asynchronous.database import AsyncDatabase

from app.core.exceptions import NotFoundError
from app.models.enums import MatchStatus
from app.repositories.country_repo import CountryRepository
from app.repositories.course_repo import CourseRepository
from app.repositories.student_repo import StudentRepository
from app.schemas.course import CourseResponse
from app.schemas.matching import CourseMatchResponse, CourseMatchResult


class MatchingService:
    """
    Transparent rule-based course matching recommendation engine.
    Evaluates student academic profile against catalog courses.
    Note: This is a deterministic rule-based evaluation engine, not machine learning.
    """

    def __init__(self, db: AsyncDatabase):
        self.db = db
        self.student_repo = StudentRepository(db)
        self.course_repo = CourseRepository(db)
        self.country_repo = CountryRepository(db)

    async def match_courses_for_student(self, student_user_id: str) -> CourseMatchResponse:
        profile = await self.student_repo.get_by_user_id(student_user_id)
        if not profile:
            raise NotFoundError("Student Profile", student_user_id)

        # Retrieve all active courses
        courses = await self.course_repo.list_courses(active_only=True, limit=500)

        # Pre-cache country codes for fast matching
        countries = await self.country_repo.list_countries(active_only=False)
        country_id_to_code = {str(c["_id"]): c.get("code", "").upper() for c in countries}
        country_id_to_name = {str(c["_id"]): c.get("name", "").lower() for c in countries}

        student_score = profile.get("academic_score")
        student_level = profile.get("intended_study_level")
        student_budget = profile.get("budget")
        preferred_countries = [c.strip().upper() for c in profile.get("preferred_countries", [])]
        preferred_country_names = [
            c.strip().lower() for c in profile.get("preferred_countries", [])
        ]

        criteria_summary = {
            "academic_score": student_score,
            "intended_study_level": student_level,
            "budget": student_budget,
            "preferred_countries": profile.get("preferred_countries", []),
            "intended_course": profile.get("intended_course"),
        }

        results: list[CourseMatchResult] = []
        matches_count = 0
        needs_review_count = 0
        insufficient_data_count = 0

        # Check for insufficient student profile data
        has_insufficient_data = (
            student_score is None or student_level is None or student_budget is None
        )

        for course in courses:
            course_schema = CourseResponse.model_validate(course)
            course_country_id = str(course.get("country_id"))
            course_code = country_id_to_code.get(course_country_id, "")
            course_country_name = country_id_to_name.get(course_country_id, "")

            if has_insufficient_data:
                insufficient_data_count += 1
                results.append(
                    CourseMatchResult(
                        course=course_schema,
                        match_status=MatchStatus.INSUFFICIENT_DATA,
                        score_match=False,
                        level_match=False,
                        country_match=False,
                        budget_match=False,
                        explanation="Student profile lacks required academic score, study level, or budget information.",
                        reasons=["Incomplete student academic profile."],
                    )
                )
                continue

            # 1. Academic Score Rule: student_score >= course min_academic_score
            min_score = course.get("min_academic_score", 50.0)
            score_match = student_score >= min_score

            # 2. Study Level Rule
            course_level = course.get("study_level")
            level_match = student_level == course_level

            # 3. Country Preference Rule
            country_match = True
            if preferred_countries:
                country_match = (
                    course_code in preferred_countries
                    or course_country_name in preferred_country_names
                )

            # 4. Budget Rule: tuition_fee <= student budget
            course_fee = course.get("tuition_fee", 0.0)
            budget_match = course_fee <= student_budget

            # Compile deterministic match status and detailed explanation
            reasons: list[str] = []
            if score_match:
                reasons.append(
                    f"Academic score ({student_score}%) satisfies course requirement (min {min_score}%)."
                )
            else:
                reasons.append(
                    f"Academic score ({student_score}%) is below minimum requirement ({min_score}%)."
                )

            if level_match:
                reasons.append(f"Intended study level '{student_level}' matches course level.")
            else:
                reasons.append(
                    f"Course study level '{course_level}' differs from intended '{student_level}'."
                )

            if country_match:
                if preferred_countries:
                    reasons.append(
                        f"Course destination ({course_code}) matches student's preferred countries."
                    )
                else:
                    reasons.append("No destination country restriction specified.")
            else:
                reasons.append(
                    f"Course destination ({course_code}) is not in student's preferred country list."
                )

            if budget_match:
                reasons.append(
                    f"Tuition fee (${course_fee:,.2f}) is within student's stated budget (${student_budget:,.2f})."
                )
            else:
                deficit = course_fee - student_budget
                reasons.append(
                    f"Tuition fee (${course_fee:,.2f}) exceeds student budget by ${deficit:,.2f}."
                )

            # Deterministic verdict
            all_matched = score_match and level_match and country_match and budget_match
            if all_matched:
                match_status = MatchStatus.MATCHES
                explanation = "Direct Rule Match: The student meets academic, study level, destination, and budget criteria."
                matches_count += 1
            else:
                match_status = MatchStatus.NEEDS_REVIEW
                unmatched_facets = []
                if not score_match:
                    unmatched_facets.append("academic requirements")
                if not level_match:
                    unmatched_facets.append("study level")
                if not country_match:
                    unmatched_facets.append("country preference")
                if not budget_match:
                    unmatched_facets.append("budget capacity")
                explanation = f"Counselor Review Advised: Course does not fully align on {', '.join(unmatched_facets)}."
                needs_review_count += 1

            results.append(
                CourseMatchResult(
                    course=course_schema,
                    match_status=match_status,
                    score_match=score_match,
                    level_match=level_match,
                    country_match=country_match,
                    budget_match=budget_match,
                    explanation=explanation,
                    reasons=reasons,
                )
            )

        return CourseMatchResponse(
            student_id=student_user_id,
            student_criteria=criteria_summary,
            results=results,
            total_evaluated=len(results),
            matches_count=matches_count,
            needs_review_count=needs_review_count,
            insufficient_data_count=insufficient_data_count,
        )
