import io

import pytest
from httpx import AsyncClient

from app.models.enums import DocumentCategory, DocumentStatus, UserRole


@pytest.mark.asyncio
async def test_document_lifecycle(
    client: AsyncClient, student_auth, officer_auth, create_user_factory
):
    # Second student for isolation test
    other_student = await create_user_factory(email="other.student@test.com", role=UserRole.STUDENT)

    # 1. Student uploads a valid PDF document
    pdf_bytes = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    files = {"file": ("academic_transcript.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    data = {"category": DocumentCategory.ACADEMIC_TRANSCRIPT.value}

    up_resp = await client.post(
        "/api/v1/documents/upload",
        headers=student_auth["headers"],
        data=data,
        files=files,
    )
    assert up_resp.status_code == 201
    doc_data = up_resp.json()
    doc_id = doc_data["id"]
    assert doc_data["original_filename"] == "academic_transcript.pdf"
    assert doc_data["status"] == DocumentStatus.PENDING.value

    # 2. Upload with invalid fake header -> rejected
    fake_files = {"file": ("fake.pdf", io.BytesIO(b"Not a PDF file content"), "application/pdf")}
    invalid_up = await client.post(
        "/api/v1/documents/upload",
        headers=student_auth["headers"],
        data=data,
        files=fake_files,
    )
    assert invalid_up.status_code == 400

    # 3. Documentation Officer reviews document
    review_payload = {
        "status": DocumentStatus.APPROVED.value,
        "feedback": "Official stamp verified and clear.",
    }
    review_resp = await client.post(
        f"/api/v1/documents/{doc_id}/review",
        headers=officer_auth["headers"],
        json=review_payload,
    )
    assert review_resp.status_code == 200
    rev_data = review_resp.json()
    assert rev_data["status"] == DocumentStatus.APPROVED.value
    assert rev_data["reviewer_id"] == officer_auth["id"]
    assert rev_data["review_feedback"] == "Official stamp verified and clear."

    # 4. Download file - owner student succeeds
    download_resp = await client.get(
        f"/api/v1/documents/{doc_id}/download",
        headers=student_auth["headers"],
    )
    assert download_resp.status_code == 200
    assert download_resp.content == pdf_bytes

    # 5. Download file - other student is forbidden
    other_dl_resp = await client.get(
        f"/api/v1/documents/{doc_id}/download",
        headers=other_student["headers"],
    )
    assert other_dl_resp.status_code == 403
