from functools import lru_cache
from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Project metadata
    PROJECT_NAME: str = "Pocket Consultancy V2"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # Security & Tokens
    SECRET_KEY: str = "pocket-consultancy-v2-dev-secret-key-32-chars-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # MongoDB Configuration
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "pocket_consultancy_v2"
    MONGODB_MIN_POOL_SIZE: int = 5
    MONGODB_MAX_POOL_SIZE: int = 50
    MONGODB_SERVER_SELECTION_TIMEOUT_MS: int = 5000

    # Storage Settings
    UPLOAD_DIR: str = "storage/uploads"
    MAX_UPLOAD_SIZE_MB: int = 5

    # CORS Settings (accepts JSON string, list, or comma-separated string)
    ALLOWED_ORIGINS: list[str] | str = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
    ]

    # Seed Admin Settings
    ADMIN_EMAIL: str = "admin@pocketconsultancy.com"
    ADMIN_PASSWORD: str = "AdminSecurePassword123!"
    ADMIN_FULL_NAME: str = "System Administrator"

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, v: Any) -> bool:
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            return v.lower() in ("true", "1", "yes", "t", "debug")
        return bool(v)

    @field_validator("ALLOWED_ORIGINS", mode="after")
    @classmethod
    def assemble_cors_origins(cls, v: list[str] | str) -> list[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json

                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    @property
    def max_upload_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
