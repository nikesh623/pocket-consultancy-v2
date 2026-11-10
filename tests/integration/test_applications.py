import pytest
from httpx import AsyncClient

from app.models.enums import ApplicationStatus, StudyLevel


@pytest.mark.asyncio
async def test_application_workflow_and_history(
    client: AsyncClient, admin_auth, counselor_auth, student_auth
):
    # Setup country, university, and course
    c_resp = await client.post(
        "/api/v1/countries/",
        headers=admin_auth["headers"],
        json={"name": "Australia", "code": "AU", "currency": "AUD", "is_active": True},
    )
    country_id = c_resp.json()["id"]

    u_resp = await client.post(
        "/api/v1/universities/",
        headers=admin_auth["headers"],
        json={
            "name": "Melbourne Uni",
            "country_id": country_id,
            "city": "Melbourne",
            "is_active": True,
        },
    )
    univ_id = u_resp.json()["id"]

    co_resp = await client.post(
        "/api/v1/courses/",
        headers=admin_auth["headers"],
        json={
            "name": "Master of IT",
            "university_id": univ_id,
            "country_id": country_id,
            "study_level": StudyLevel.POSTGRADUATE.value,
            "duration_months": 24,
            "tuition_fee": 44000.0,
            "currency": "AUD",
            "min_academic_score": 70.0,
            "entry_requirements": "Undergraduate degree in any discipline",
            "is_active": True,
        },
    )
    course_id = co_resp.json()["id"]

    # 1. Student submits application
    app_payload = {"course_id": course_id, "remarks": "Preferred intake: Fall"}
    sub_resp = await client.post(
        "/api/v1/applications/",
        headers=student_auth["headers"],
        json=app_payload,
    )
    assert sub_resp.status_code == 201
    app_data = sub_resp.json()
    app_id = app_data["id"]
    ref_num = app_data["reference_number"]
    assert ref_num.startswith("PC-")
    assert app_data["status"] == ApplicationStatus.SUBMITTED.value

    # 2. Counselor moves application to 'under_review'
    trans1 = await client.post(
        f"/api/v1/applications/{app_id}/transition",
        headers=counselor_auth["headers"],
        json={
            "new_status": ApplicationStatus.UNDER_REVIEW.value,
            "remarks": "Academic transcripts under verification.",
        },
    )
    assert trans1.status_code == 200
    assert trans1.json()["status"] == ApplicationStatus.UNDER_REVIEW.value

    # 3. Counselor moves application to 'shortlisted'
    trans2 = await client.post(
        f"/api/v1/applications/{app_id}/transition",
        headers=counselor_auth["headers"],
        json={
            "new_status": ApplicationStatus.SHORTLISTED.value,
            "remarks": "Profile forwarded to University Admissions Committee.",
        },
    )
    assert trans2.status_code == 200
    assert trans2.json()["status"] == ApplicationStatus.SHORTLISTED.value

    # 4. Invalid status jump (e.g. invalid transition from shortlisted directly to submitted)
    invalid_trans = await client.post(
        f"/api/v1/applications/{app_id}/transition",
        headers=counselor_auth["headers"],
        json={"new_status": ApplicationStatus.SUBMITTED.value},
    )
    assert invalid_trans.status_code == 422

    # 5. Counselor records 'offer_received'
    trans3 = await client.post(
        f"/api/v1/applications/{app_id}/transition",
        headers=counselor_auth["headers"],
        json={
            "new_status": ApplicationStatus.OFFER_RECEIVED.value,
            "remarks": "Official offer letter received from university.",
        },
    )
    assert trans3.status_code == 200

    # 6. Check detailed audit history
    detail_resp = await client.get(
        f"/api/v1/applications/{app_id}",
        headers=student_auth["headers"],
    )
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["application"]["status"] == ApplicationStatus.OFFER_RECEIVED.value
    # History must contain initial submission + 3 status updates = at least 4 entries
    assert len(detail["history"]) >= 4
    # Most recent history entry is offer_received
    assert detail["history"][0]["new_status"] == ApplicationStatus.OFFER_RECEIVED.value
