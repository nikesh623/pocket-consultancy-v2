from typing import Any

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from fastapi.responses import FileResponse
from pymongo.asynchronous.database import AsyncDatabase

from app.core.dependencies import (
    get_current_user,
    get_db,
    require_documentation_officer,
    require_student,
)
from app.models.enums import DocumentCategory, DocumentStatus
from app.schemas.document import (
    DocumentListResponse,
    DocumentResponse,
    DocumentReviewRequest,
)
from app.services.document_service import DocumentService

router = APIRouter(prefix="/documents", tags=["Document Management"])


@router.post(
    "/upload",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Student upload document",
    description="Upload a document file (PDF, JPG, JPEG, PNG; max 5MB). Content magic-byte header is verified.",
)
async def upload_document(
    category: DocumentCategory = Form(...),
    file: UploadFile = File(...),
    current_user: dict[str, Any] = Depends(require_student),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    file_bytes = await file.read()
    doc_service = DocumentService(db)
    doc = await doc_service.upload_document(
        student_id=str(current_user["_id"]),
        filename=file.filename or "uploaded_file",
        file_bytes=file_bytes,
        category=category,
    )
    return DocumentResponse.model_validate(doc)


@router.get(
    "/",
    response_model=DocumentListResponse,
    summary="List documents",
    description="Students view their own uploaded documents. Documentation officers and administrators view all documents with optional status filters.",
)
async def list_documents(
    student_id: str | None = Query(None, description="Filter by student (officers/admins only)"),
    status: DocumentStatus | None = Query(None, description="Filter by review status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    doc_service = DocumentService(db)
    items = await doc_service.list_documents(
        requesting_user=current_user,
        student_id=student_id,
        status=status,
        skip=skip,
        limit=limit,
    )
    return {
        "items": [DocumentResponse.model_validate(d) for d in items],
        "total": len(items),
    }


@router.get(
    "/{document_id}/download",
    summary="Download document file",
    description="Protected file access endpoint. Accessible only to the document owner student, documentation officers, and administrators.",
)
async def download_document(
    document_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    doc_service = DocumentService(db)
    file_info = await doc_service.get_document_file_path(document_id, current_user)
    return FileResponse(
        path=file_info["path"],
        filename=file_info["filename"],
        media_type=file_info["content_type"],
    )


@router.post(
    "/{document_id}/review",
    response_model=DocumentResponse,
    summary="Documentation Officer review document",
    description="Approve or reject a document with feedback. Updates reviewer ID and review timestamp.",
)
async def review_document(
    document_id: str,
    data: DocumentReviewRequest,
    current_user: dict[str, Any] = Depends(require_documentation_officer),
    db: AsyncDatabase = Depends(get_db),
) -> Any:
    doc_service = DocumentService(db)
    reviewed = await doc_service.review_document(
        document_id=document_id,
        reviewer_id=str(current_user["_id"]),
        review_data=data,
    )
    return DocumentResponse.model_validate(reviewed)
