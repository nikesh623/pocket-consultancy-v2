from datetime import UTC, datetime
from typing import Any

from bson import ObjectId
from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator


class MongoBaseModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

    id: str | None = Field(
        default=None,
        validation_alias=AliasChoices("_id", "id"),
    )

    @field_validator("id", mode="before")
    @classmethod
    def serialize_id(cls, v: Any) -> str | None:
        if v is None:
            return None
        if isinstance(v, ObjectId):
            return str(v)
        return str(v)


def utc_now() -> datetime:
    """Return timezone-aware current UTC datetime."""
    return datetime.now(UTC)
