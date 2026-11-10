import logging
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("pocket_consultancy")


class AppException(Exception):
    """Base application exception."""

    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        code: str = "INTERNAL_SERVER_ERROR",
        details: dict[str, Any] | None = None,
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code
        self.details = details or {}


class NotFoundError(AppException):
    def __init__(self, resource: str, identifier: Any = None):
        msg = f"{resource} not found"
        if identifier:
            msg = f"{resource} with identifier '{identifier}' was not found"
        super().__init__(
            message=msg,
            status_code=status.HTTP_404_NOT_FOUND,
            code="NOT_FOUND",
        )


class AuthenticationError(AppException):
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHORIZED",
        )


class AuthorizationError(AppException):
    def __init__(self, message: str = "You do not have permission to perform this action"):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            code="FORBIDDEN",
        )


class ConflictError(AppException):
    def __init__(self, message: str):
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            code="CONFLICT",
        )


HTTP_422_STATUS = getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", 422)


class DomainValidationError(AppException):
    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(
            message=message,
            status_code=HTTP_422_STATUS,
            code="VALIDATION_ERROR",
            details=details,
        )


class FileValidationError(AppException):
    def __init__(self, message: str):
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            code="INVALID_FILE",
        )


class DatabaseError(AppException):
    def __init__(self, message: str = "A database operation failed"):
        super().__init__(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="DATABASE_ERROR",
        )


def register_exception_handlers(app: FastAPI) -> None:
    """Register uniform exception handlers with FastAPI application."""

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                }
            },
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": "HTTP_ERROR",
                    "message": str(exc.detail),
                    "details": {},
                }
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        # Simplify validation error format for consumers
        errors = []
        for err in exc.errors():
            loc = " -> ".join(str(item) for item in err.get("loc", []))
            errors.append({"field": loc, "message": err.get("msg")})
        return JSONResponse(
            status_code=HTTP_422_STATUS,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Input validation failed",
                    "details": {"validation_errors": errors},
                }
            },
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled server exception: %s", exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred. Please contact system support.",
                    "details": {},
                }
            },
        )
