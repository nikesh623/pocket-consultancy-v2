import secrets
from datetime import UTC, datetime


def generate_application_reference() -> str:
    """
    Generate a unique, human-readable application reference number
    in the format: PC-YYYY-XXXXXXXX
    Example: PC-2026-A1B2C3D4
    """
    year = datetime.now(UTC).year
    random_hex = secrets.token_hex(4).upper()  # 8 hex characters
    return f"PC-{year}-{random_hex}"
