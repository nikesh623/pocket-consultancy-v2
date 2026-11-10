import pytest

from app.core.exceptions import FileValidationError
from app.utils.file_validator import validate_file_content


def test_valid_pdf_file():
    pdf_content = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    mime, ext = validate_file_content(pdf_content, "transcript.pdf")
    assert mime == "application/pdf"
    assert ext == ".pdf"


def test_valid_png_file():
    png_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
    mime, ext = validate_file_content(png_content, "photo.png")
    assert mime == "image/png"
    assert ext == ".png"


def test_valid_jpeg_file():
    jpg_content = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01"
    mime, ext = validate_file_content(jpg_content, "passport.jpg")
    assert mime == "image/jpeg"
    assert ext == ".jpg"


def test_empty_file_rejected():
    with pytest.raises(FileValidationError, match="File content is empty"):
        validate_file_content(b"", "document.pdf")


def test_unsupported_extension():
    with pytest.raises(FileValidationError, match="Unsupported file extension"):
        validate_file_content(b"some content", "script.exe")


def test_spoofed_file_content():
    # File named .pdf but containing plain text or wrong header
    with pytest.raises(FileValidationError, match="File signature mismatch"):
        validate_file_content(b"This is not a real PDF file header", "document.pdf")


def test_oversized_file():
    # Create fake oversized content (> 5MB)
    oversized = b"%PDF-" + b"0" * (6 * 1024 * 1024)
    with pytest.raises(FileValidationError, match="File size exceeds maximum allowed limit"):
        validate_file_content(oversized, "big.pdf")
