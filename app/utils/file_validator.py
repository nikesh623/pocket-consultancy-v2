import os

from app.core.config import get_settings
from app.core.exceptions import FileValidationError

settings = get_settings()

ALLOWED_MIME_TYPES = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
}

# Magic byte signatures
MAGIC_SIGNATURES = {
    b"%PDF-": ("application/pdf", ".pdf"),
    b"\x89PNG\r\n\x1a\n": ("image/png", ".png"),
    b"\xff\xd8\xff": ("image/jpeg", ".jpg"),
}


def validate_file_content(content: bytes, filename: str) -> tuple[str, str]:
    """
    Validate uploaded file size, extension, and content magic bytes.
    Returns: (detected_content_type, sanitized_extension)
    Raises: FileValidationError if invalid.
    """
    if not content:
        raise FileValidationError("File content is empty")

    if len(content) > settings.max_upload_bytes:
        raise FileValidationError(
            f"File size exceeds maximum allowed limit of {settings.MAX_UPLOAD_SIZE_MB}MB"
        )

    # Check extension
    _, ext = os.path.splitext(filename.lower())
    if ext not in [".pdf", ".jpg", ".jpeg", ".png"]:
        raise FileValidationError(
            f"Unsupported file extension '{ext}'. Only PDF, JPG, JPEG, and PNG are allowed."
        )

    # Validate file magic bytes
    detected_mime = None
    canonical_ext = None
    for magic, (mime, def_ext) in MAGIC_SIGNATURES.items():
        if content.startswith(magic):
            detected_mime = mime
            canonical_ext = def_ext
            break

    if not detected_mime:
        raise FileValidationError(
            "File signature mismatch or corrupted file. Actual binary content does not match allowed types (PDF, JPG, PNG)."
        )

    # Disallow mismatch between extension and magic type
    if ext in [".jpg", ".jpeg"] and detected_mime != "image/jpeg":
        raise FileValidationError(
            "File extension indicates JPEG but content signature does not match."
        )
    if ext == ".png" and detected_mime != "image/png":
        raise FileValidationError(
            "File extension indicates PNG but content signature does not match."
        )
    if ext == ".pdf" and detected_mime != "application/pdf":
        raise FileValidationError(
            "File extension indicates PDF but content signature does not match."
        )

    return detected_mime, canonical_ext or ext
