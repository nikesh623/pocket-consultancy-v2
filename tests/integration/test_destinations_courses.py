import pytest
from httpx import AsyncClient

from app.models.enums import StudyLevel


@pytest.mark.asyncio
async def test_country_university_course_lifecycle(client: AsyncClient, admin_auth, student_auth):
    # 1. Admin creates a country
    country_payload = {
        "name": "United States",
        "code": "US",
        "description": "Top universities and research labs.",
        "currency": "USD",
        "is_active": True,
    }
    c_resp = await client.post(
        "/api/v1/countries/",
        headers=admin_auth["headers"],
        json=country_payload,
    )
    assert c_resp.status_code == 201
    country_data = c_resp.json()
    country_id = country_data["id"]
    assert country_data["code"] == "US"

    # Duplicate code rejected
    dup_c = await client.post(
        "/api/v1/countries/",
        headers=admin_auth["headers"],
        json=country_payload,
    )
    assert dup_c.status_code == 409

    # 2. Admin creates a university
    univ_payload = {
        "name": "MIT",
        "country_id": country_id,
        "city": "Cambridge, MA",
        "website": "https://mit.edu",
        "description": "Massachusetts Institute of Technology",
        "is_active": True,
    }
    u_resp = await client.post(
        "/api/v1/universities/",
        headers=admin_auth["headers"],
        json=univ_payload,
    )
    assert u_resp.status_code == 201
    univ_data = u_resp.json()
    univ_id = univ_data["id"]

    # 3. Admin creates courses
    course1_payload = {
        "name": "MSc Computer Science",
        "university_id": univ_id,
        "country_id": country_id,
        "study_level": StudyLevel.POSTGRADUATE.value,
        "duration_months": 24,
        "tuition_fee": 50000.0,
        "currency": "USD",
        "min_academic_score": 80.0,
        "entry_requirements": "BSc in computing with GPA >= 3.5 or 80%.",
        "description": "Advanced algorithms and systems.",
        "is_active": True,
    }
    co1_resp = await client.post(
        "/api/v1/courses/",
        headers=admin_auth["headers"],
        json=course1_payload,
    )
    assert co1_resp.status_code == 201

    course2_payload = {
        "name": "BSc Artificial Intelligence",
        "university_id": univ_id,
        "country_id": country_id,
        "study_level": StudyLevel.UNDERGRADUATE.value,
        "duration_months": 48,
        "tuition_fee": 45000.0,
        "currency": "USD",
        "min_academic_score": 75.0,
        "entry_requirements": "High school math and physics.",
        "description": "Foundations of AI.",
        "is_active": True,
    }
    co2_resp = await client.post(
        "/api/v1/courses/",
        headers=admin_auth["headers"],
        json=course2_payload,
    )
    assert co2_resp.status_code == 201

    # 4. Student queries course list with filtering
    list_resp = await client.get(
        "/api/v1/courses/?study_level=postgraduate",
        headers=student_auth["headers"],
    )
    assert list_resp.status_code == 200
    items = list_resp.json()["items"]
    assert len(items) == 1
    assert items[0]["name"] == "MSc Computer Science"

    # Filter with maximum fee
    fee_resp = await client.get(
        "/api/v1/courses/?max_fee=48000",
        headers=student_auth["headers"],
    )
    assert fee_resp.status_code == 200
    fee_items = fee_resp.json()["items"]
    assert len(fee_items) == 1
    assert fee_items[0]["name"] == "BSc Artificial Intelligence"
