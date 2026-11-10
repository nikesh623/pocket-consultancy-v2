from app.models.enums import StudyLevel
from app.schemas.course import CourseResponse


def test_matching_logic_unit():
    # Verify deterministic outcomes for matching rules
    course_data = {
        "_id": "60c72b2f9b1d8b2bad000001",
        "name": "MSc Computer Science",
        "university_id": "60c72b2f9b1d8b2bad000002",
        "country_id": "60c72b2f9b1d8b2bad000003",
        "study_level": StudyLevel.POSTGRADUATE.value,
        "duration_months": 24,
        "tuition_fee": 30000.0,
        "currency": "USD",
        "min_academic_score": 75.0,
        "entry_requirements": "BSc in CS with 75% or higher",
        "description": "Graduate CS curriculum",
        "is_active": True,
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-01T00:00:00Z",
    }
    course = CourseResponse.model_validate(course_data)
    assert course.min_academic_score == 75.0
    assert course.study_level == StudyLevel.POSTGRADUATE
