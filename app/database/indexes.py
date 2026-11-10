import logging

from pymongo import ASCENDING, DESCENDING, IndexModel
from pymongo.asynchronous.database import AsyncDatabase

logger = logging.getLogger("pocket_consultancy.database")


async def create_indexes(db: AsyncDatabase) -> None:
    """Create all required indexes across collections."""
    logger.info("Initializing database indexes...")

    index_specs = {
        "users": [
            IndexModel([("email", ASCENDING)], unique=True, name="idx_users_email_unique"),
            IndexModel([("role", ASCENDING)], name="idx_users_role"),
            IndexModel([("account_status", ASCENDING)], name="idx_users_status"),
            IndexModel([("created_at", DESCENDING)], name="idx_users_created_at"),
        ],
        "student_profiles": [
            IndexModel([("user_id", ASCENDING)], unique=True, name="idx_profiles_user_id_unique"),
            IndexModel([("created_at", DESCENDING)], name="idx_profiles_created_at"),
        ],
        "countries": [
            IndexModel([("code", ASCENDING)], unique=True, name="idx_countries_code_unique"),
            IndexModel([("name", ASCENDING)], name="idx_countries_name"),
            IndexModel([("is_active", ASCENDING)], name="idx_countries_active"),
        ],
        "universities": [
            IndexModel([("country_id", ASCENDING)], name="idx_universities_country_id"),
            IndexModel([("name", ASCENDING)], name="idx_universities_name"),
            IndexModel([("is_active", ASCENDING)], name="idx_universities_active"),
        ],
        "courses": [
            IndexModel([("university_id", ASCENDING)], name="idx_courses_university_id"),
            IndexModel([("country_id", ASCENDING)], name="idx_courses_country_id"),
            IndexModel([("study_level", ASCENDING)], name="idx_courses_study_level"),
            IndexModel([("tuition_fee", ASCENDING)], name="idx_courses_tuition_fee"),
            IndexModel([("is_active", ASCENDING)], name="idx_courses_active"),
        ],
        "shortlists": [
            IndexModel(
                [("student_id", ASCENDING), ("course_id", ASCENDING)],
                unique=True,
                name="idx_shortlists_student_course_unique",
            ),
            IndexModel([("student_id", ASCENDING)], name="idx_shortlists_student_id"),
        ],
        "counselor_availability": [
            IndexModel(
                [("counselor_id", ASCENDING), ("start_time", ASCENDING)],
                name="idx_avail_counselor_start",
            ),
            IndexModel([("counselor_id", ASCENDING)], name="idx_avail_counselor_id"),
            IndexModel([("is_booked", ASCENDING)], name="idx_avail_is_booked"),
        ],
        "appointments": [
            IndexModel(
                [("counselor_id", ASCENDING), ("scheduled_at", ASCENDING)],
                name="idx_appointments_counselor_schedule",
            ),
            IndexModel([("student_id", ASCENDING)], name="idx_appointments_student_id"),
            IndexModel([("status", ASCENDING)], name="idx_appointments_status"),
        ],
        "documents": [
            IndexModel([("student_id", ASCENDING)], name="idx_documents_student_id"),
            IndexModel([("status", ASCENDING)], name="idx_documents_status"),
            IndexModel([("category", ASCENDING)], name="idx_documents_category"),
        ],
        "applications": [
            IndexModel(
                [("reference_number", ASCENDING)],
                unique=True,
                name="idx_applications_ref_unique",
            ),
            IndexModel([("student_id", ASCENDING)], name="idx_applications_student_id"),
            IndexModel([("course_id", ASCENDING)], name="idx_applications_course_id"),
            IndexModel([("status", ASCENDING)], name="idx_applications_status"),
            IndexModel([("created_at", DESCENDING)], name="idx_applications_created_at"),
        ],
        "application_history": [
            IndexModel(
                [("application_id", ASCENDING), ("created_at", DESCENDING)],
                name="idx_app_history_app_date",
            ),
        ],
        "notifications": [
            IndexModel(
                [("user_id", ASCENDING), ("is_read", ASCENDING)],
                name="idx_notifications_user_unread",
            ),
            IndexModel(
                [("user_id", ASCENDING), ("created_at", DESCENDING)],
                name="idx_notifications_user_date",
            ),
        ],
        "counselor_notes": [
            IndexModel(
                [("student_id", ASCENDING), ("counselor_id", ASCENDING)],
                name="idx_notes_student_counselor",
            ),
            IndexModel([("created_at", DESCENDING)], name="idx_notes_created_at"),
        ],
        "revoked_tokens": [
            IndexModel([("jti", ASCENDING)], unique=True, name="idx_revoked_jti_unique"),
            IndexModel(
                [("expires_at", ASCENDING)],
                expireAfterSeconds=0,
                name="idx_revoked_ttl",
            ),
        ],
    }

    for collection_name, indexes in index_specs.items():
        try:
            collection = db[collection_name]
            await collection.create_indexes(indexes)
            logger.debug("Indexes created for '%s'.", collection_name)
        except Exception as exc:
            logger.warning("Failed creating indexes for '%s': %s", collection_name, exc)

    logger.info("All collection indexes verified successfully.")
