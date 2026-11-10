# Pocket Consultancy V2 — Agent Development Rules & Conventions

This document outlines the architectural patterns, security standards, coding guidelines, and operational procedures for all AI coding agents working on **Pocket Consultancy V2**.

---

## 1. Project Boundaries & Protection
- **Target Workspace:** `C:\Users\sahni\OneDrive\Desktop\Deskopt_vs\pocket-consultancy-v2` (V2).
- **Protected Workspace:** `C:\Users\sahni\OneDrive\Desktop\Deskopt_vs\pocket-consultancy` (Original Django project).
- **Rule:** Never modify, delete, overwrite, stage, or reference files in the legacy Django directory. All V2 development must remain strictly contained within `pocket-consultancy-v2`.

---

## 2. Technology Stack & Compatibility
- **Runtime:** Python 3.14.
- **Web Framework:** FastAPI (asynchronous routes, modern lifespan handlers).
- **Database Driver:** Official PyMongo Async API (`from pymongo import AsyncMongoClient`).
  * **Critical:** Do NOT import or use `motor`. Use official PyMongo `AsyncMongoClient` (PyMongo 4.9+).
- **Data Validation:** Pydantic v2 conventions (`model_validate`, `model_dump`, `ConfigDict`).
- **Configuration:** `pydantic-settings` via `BaseSettings`.
- **Password Hashing:** Argon2 via `argon2-cffi`. Plaintext passwords or MD5/SHA hashes are forbidden.
- **Authentication:** JWT (HMAC-SHA256) with access tokens and refresh tokens.
- **Code Quality:** Ruff (`ruff check`, `ruff format`).
- **Testing:** Pytest + HTTPX (`pytest-asyncio`).

---

## 3. Architecture & Layering
Strict layered separation of concerns:
1. **API Layer (`app/api/v1/endpoints/`):** Route definitions, HTTP status codes, query parameters, dependency injections. Minimal logic; delegate immediately to services.
2. **Schema Layer (`app/schemas/`):** Request validation, response serialization, DTOs. Never return raw MongoDB `_id` without string serialization or alias mapping (`id`).
3. **Service Layer (`app/services/`):** Domain workflows, validation rules, business logic (e.g. course matching, status transitions, notifications).
4. **Repository Layer (`app/repositories/`):** Direct database queries, atomic operations, filters, projections.
5. **Database Layer (`app/database/`):** Connection pool management (`AsyncMongoClient`), indexes, collection initialization.
6. **Core Layer (`app/core/`):** Configuration, security utilities, authentication dependencies, centralized error handling.
7. **Utility Layer (`app/utils/`):** Pure helper functions (file magic-byte validation, reference ID generation).

---

## 4. Security & Access Control
- **Roles:**
  - `student`: Self-service profile, shortlists, appointments, document uploads, application tracking.
  - `counselor`: Student review, availability management, appointment operations, private counselor notes.
  - `documentation_officer`: Document inspection, approval/rejection, verification feedback.
  - `admin`: Full system control, account approval/deactivation, catalog management, global auditing.
- **Student Registration Flow:** Public registration creates accounts in `pending` approval state. Unapproved accounts cannot obtain active tokens or access protected endpoints.
- **Data Isolation:** Students must never access another student's documents, applications, or profile.
- **File Uploads:**
  - Enforce maximum 5MB size limit.
  - Allowed types: PDF, JPG, JPEG, PNG.
  - Inspect magic bytes (file signature), not merely client MIME types or filename extensions.
  - Never store uploaded file bytes in MongoDB documents; store metadata in MongoDB and raw files in secure storage.
  - Download endpoints must be protected behind role and ownership checks.
- **Course Matching:** Pure rule-based evaluation. Never misrepresent rule-based heuristics as AI/ML.

---

## 5. Coding & Formatting Standards
- Type annotations are required on all function arguments and return types.
- Follow PEP 8 and modern Python 3.12+ features.
- Avoid broad `except Exception:` without logging or appropriate error transformation.
- Centralize exceptions via custom domain exceptions handled in `app/core/exceptions.py`.
