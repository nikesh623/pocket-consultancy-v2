import logging
import os
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from typing import Any

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.database.connection import (
    close_mongo_connection,
    connect_to_mongo,
    mongo_manager,
)
from app.database.initialization import init_database

settings = get_settings()

# Configure structured logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("pocket_consultancy")

START_TIME = datetime.now(UTC)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Modern FastAPI application lifespan context manager."""
    logger.info("Initializing %s...", settings.PROJECT_NAME)

    # 1. Ensure storage directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    # 2. Connect to MongoDB
    try:
        await connect_to_mongo()
        if mongo_manager.db is not None:
            await init_database(mongo_manager.db)
    except Exception as exc:
        logger.error("Database initialization encountered an error: %s", exc)

    logger.info("%s started successfully.", settings.PROJECT_NAME)
    yield

    # 3. Shutdown teardown
    logger.info("Initiating graceful shutdown...")
    await close_mongo_connection()
    logger.info("Teardown completed.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "Professional Role-Based Education Consultancy Management REST API.\n\n"
        "Supports complete consultancy workflows including Student Profiles, Rule-Based Course Matching, "
        "Counseling Availability & Appointments, Secure Document Management, and Multi-Stage Application Tracking."
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Explicit CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Centralized application exception handlers
register_exception_handlers(app)

# Include v1 versioned API router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get(
    "/",
    tags=["Root & System"],
    summary="System root metadata",
)
async def root() -> dict[str, Any]:
    return {
        "project": settings.PROJECT_NAME,
        "version": "2.0.0",
        "environment": settings.ENVIRONMENT,
        "status": "operational",
        "documentation": {
            "swagger_ui": "/docs",
            "redoc": "/redoc",
            "openapi_spec": "/openapi.json",
        },
        "api_v1_base": settings.API_V1_STR,
    }


@app.get(
    "/health",
    tags=["Root & System"],
    summary="Health check endpoint",
)
async def health_check() -> JSONResponse:
    db_status = "disconnected"
    db_latency_ms = None

    if mongo_manager.client is not None:
        try:
            start_ping = datetime.now(UTC)
            await mongo_manager.client.admin.command("ping")
            latency = (datetime.now(UTC) - start_ping).total_seconds() * 1000
            db_status = "connected"
            db_latency_ms = round(latency, 2)
        except Exception as exc:
            db_status = f"unhealthy ({str(exc)})"

    storage_writable = os.access(settings.UPLOAD_DIR, os.W_OK)
    uptime_seconds = int((datetime.now(UTC) - START_TIME).total_seconds())

    is_healthy = db_status == "connected" and storage_writable

    health_data = {
        "status": "healthy" if is_healthy else "degraded",
        "uptime_seconds": uptime_seconds,
        "database": {
            "status": db_status,
            "latency_ms": db_latency_ms,
            "name": settings.MONGODB_DB_NAME,
        },
        "storage": {
            "directory": settings.UPLOAD_DIR,
            "writable": storage_writable,
            "max_file_size_mb": settings.MAX_UPLOAD_SIZE_MB,
        },
        "timestamp": datetime.now(UTC).isoformat(),
    }

    status_code = status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(status_code=status_code, content=health_data)
