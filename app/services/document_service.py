import os
import uuid
from typing import Any

from pymongo.asynchronous.database import AsyncDatabase

from app.core.config import get_settings
from app.core.exceptions import AuthorizationError, NotFoundError
from app.models.enums import DocumentCategory, DocumentStatus, NotificationType, UserRole
from app.repositories.document_repo import DocumentRepository
from app.schemas.document import DocumentReviewRequest
from app.services.notification_service import NotificationService
from app.utils.file_validator import validate_file_content

settings = get_settings()


class DocumentService:
    def __init__(self, db: AsyncDatabase):
        self.db = db
        self.document_repo = DocumentRepository(db)
        self.notification_service = NotificationService(db)

    async def upload_document(
        self,
        student_id: str,
        filename: str,
        file_bytes: bytes,
        category: DocumentCategory,
    ) -> dict[str, Any]:
        # Validate magic bytes and size (enforces max 5MB and allowed types)
        detected_mime, canonical_ext = validate_file_content(file_bytes, filename)

        # Ensure upload directory exists
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

        stored_filename = f"{uuid.uuid4().hex}{canonical_ext}"
        file_path = os.path.join(settings.UPLOAD_DIR, stored_filename)

        with open(file_path, "wb") as f:
            f.write(file_bytes)

        doc = {
            "student_id": str(student_id),
            "original_filename": os.path.basename(filename),
            "stored_filename": stored_filename,
            "category": category.value,
            "file_size_bytes": len(file_bytes),
            "content_type": detected_mime,
            "status": DocumentStatus.PENDING.value,
            "reviewer_id": None,
            "review_feedback": None,
            "reviewed_at": None,
        }

        doc_id = await self.document_repo.insert_one(doc)
        doc["_id"] = doc_id

        # Notify student
        await self.notification_service.send_notification(
            user_id=student_id,
            title="Document Uploaded",
            message=f"Document '{doc['original_filename']}' ({category.value}) uploaded and awaiting review.",
            notification_type=NotificationType.DOCUMENT,
        )

        return doc

    async def review_document(
        self,
        document_id: str,
        reviewer_id: str,
        review_data: DocumentReviewRequest,
    ) -> dict[str, Any]:
        document = await self.document_repo.find_by_id(document_id)
        if not document:
            raise NotFoundError("Document", document_id)

        await self.document_repo.update_review(
            document_id=document_id,
            status=review_data.status,
            reviewer_id=reviewer_id,
            feedback=review_data.feedback,
        )

        # Notify student about review decision
        msg = f"Your document '{document['original_filename']}' was {review_data.status.value}."
        if review_data.feedback:
            msg += f" Feedback: {review_data.feedback}"

        await self.notification_service.send_notification(
            user_id=document["student_id"],
            title="Document Review Result",
            message=msg,
            notification_type=NotificationType.DOCUMENT,
        )

        return await self.document_repo.find_by_id(document_id)

    async def get_document_file_path(
        self, document_id: str, requesting_user: dict[str, Any]
    ) -> dict[str, Any]:
        """Authorize file access and return filesystem path."""
        document = await self.document_repo.find_by_id(document_id)
        if not document:
            raise NotFoundError("Document", document_id)

        req_role = requesting_user.get("role")
        req_id = str(requesting_user.get("_id"))

        # Role & ownership validation
        is_owner = document.get("student_id") == req_id
        is_officer = req_role in [UserRole.DOCUMENTATION_OFFICER.value, UserRole.ADMIN.value]

        if not (is_owner or is_officer):
            raise AuthorizationError("You are not authorized to view or download this document.")

        file_path = os.path.join(settings.UPLOAD_DIR, document["stored_filename"])
        if not os.path.exists(file_path):
            raise NotFoundError("Stored physical document file", document["stored_filename"])

        return {
            "path": file_path,
            "filename": document["original_filename"],
            "content_type": document["content_type"],
        }

    async def list_documents(
        self,
        requesting_user: dict[str, Any],
        student_id: str | None = None,
        status: DocumentStatus | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        req_role = requesting_user.get("role")
        req_id = str(requesting_user.get("_id"))

        if req_role == UserRole.STUDENT.value:
            return await self.document_repo.list_by_student(req_id)

        if student_id:
            return await self.document_repo.list_by_student(student_id)

        return await self.document_repo.list_documents(status=status, skip=skip, limit=limit)
