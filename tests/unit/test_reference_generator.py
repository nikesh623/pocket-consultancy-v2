import re
from datetime import UTC, datetime

from app.utils.reference_generator import generate_application_reference


def test_reference_format():
    year = datetime.now(UTC).year
    pattern = rf"^PC-{year}-[0-9A-F]{{8}}$"

    ref1 = generate_application_reference()
    ref2 = generate_application_reference()

    assert re.match(pattern, ref1) is not None
    assert re.match(pattern, ref2) is not None
    assert ref1 != ref2  # Must be unique
