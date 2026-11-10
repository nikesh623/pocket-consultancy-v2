import pytest
from httpx import AsyncClient

from app.models.enums import MatchStatus, StudyLevel


@pytest.mark.asyncio
async def test_student_profile_matching_and_shortlist(
    client: AsyncClient, admin_auth, counselor_auth, student_auth
):
    # Setup a destination country, university, and course
    c_resp = await client.post(
        "/api/v1/countries/",
        headers=admin_auth["headers"],
        json={"name": "Canada", "code": "CA", "currency": "CAD", "is_active": True},
    )
    country_id = c_resp.json()["id"]

    u_resp = await client.post(
        "/api/v1/universities/",
        headers=admin_auth["headers"],
        json={"name": "UBC", "country_id": country_id, "city": "Vancouver", "is_active": True},
    )
    univ_id = u_resp.json()["id"]

    co_resp = await client.post(
        "/api/v1/courses/",
        headers=admin_auth["headers"],
        json={
            "name": "MSc Software Systems",
            "university_id": univ_id,
            "country_id": country_id,
            "study_level": StudyLevel.POSTGRADUATE.value,
            "duration_months": 24,
            "tuition_fee": 35000.0,
            "currency": "CAD",
            "min_academic_score": 75.0,
            "entry_requirements": "BSc in computing with minimum 75%",
            "is_active": True,
        },
    )
    course_id = co_resp.json()["id"]

    # 1. Student creates profile
    profile_payload = {
        "full_name": "Bob Martin",
        "academic_qualification": "BSc Computer Engineering",
        "institution": "State University",
        "academic_score": 82.0,  # > 75%
        "intended_study_level": StudyLevel.POSTGRADUATE.value,
        "preferred_countries": ["CA"],
        "budget": 40000.0,  # > 35,000 CAD
        "intended_course": "Software Systems",
    }
    p_resp = await client.post(
        "/api/v1/students/me/profile",
        headers=student_auth["headers"],
        json=profile_payload,
    )
    assert p_resp.status_code == 200
    p_data = p_resp.json()
    assert p_data["academic_score"] == 82.0

    # 2. Rule-based Course Matching
    match_resp = await client.get(
        "/api/v1/students/me/matches",
        headers=student_auth["headers"],
    )
    assert match_resp.status_code == 200
    match_data = match_resp.json()
    assert match_data["total_evaluated"] >= 1
    assert match_data["matches_count"] >= 1

    first_result = match_data["results"][0]
    assert first_result["match_status"] == MatchStatus.MATCHES.value
    assert first_result["score_match"] is True
    assert first_result["budget_match"] is True
    assert "Direct Rule Match" in first_result["explanation"]

    # 3. Shortlist operations
    shortlist_add = await client.post(
        "/api/v1/students/me/shortlist",
        headers=student_auth["headers"],
        json={"course_id": course_id},
    )
    assert shortlist_add.status_code == 201

    # Duplicate add rejected
    dup_shortlist = await client.post(
        "/api/v1/students/me/shortlist",
        headers=student_auth["headers"],
        json={"course_id": course_id},
    )
    assert dup_shortlist.status_code == 409

    # List shortlist
    shortlist_list = await client.get(
        "/api/v1/students/me/shortlist",
        headers=student_auth["headers"],
    )
    assert shortlist_list.status_code == 200
    assert shortlist_list.json()["total"] == 1

    # Remove from shortlist
    rem_resp = await client.delete(
        f"/api/v1/students/me/shortlist/{course_id}",
        headers=student_auth["headers"],
    )
    assert rem_resp.status_code == 200

    # 4. Counselor Private Notes
    note_payload = {
        "student_id": student_auth["id"],
        "title": "Initial Assessment",
        "content": "Student has solid background in C++ and Python.",
    }
    note_create = await client.post(
        "/api/v1/students/counselor/notes",
        headers=counselor_auth["headers"],
        json=note_payload,
    )
    assert note_create.status_code == 201

    # Student cannot view private counselor notes
    student_notes_view = await client.get(
        f"/api/v1/students/counselor/notes/{student_auth['id']}",
        headers=student_auth["headers"],
    )
    assert student_notes_view.status_code == 403
