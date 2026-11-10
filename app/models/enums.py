from enum import StrEnum


class UserRole(StrEnum):
    STUDENT = "student"
    COUNSELOR = "counselor"
    DOCUMENTATION_OFFICER = "documentation_officer"
    ADMIN = "admin"


class AccountStatus(StrEnum):
    PENDING = "pending"
    ACTIVE = "active"
    INACTIVE = "inactive"
    REJECTED = "rejected"


class StudyLevel(StrEnum):
    UNDERGRADUATE = "undergraduate"
    POSTGRADUATE = "postgraduate"
    DOCTORATE = "doctorate"
    DIPLOMA = "diploma"
    CERTIFICATE = "certificate"


class MatchStatus(StrEnum):
    MATCHES = "matches"
    NEEDS_REVIEW = "needs_review"
    INSUFFICIENT_DATA = "insufficient_data"


class AppointmentStatus(StrEnum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class DocumentCategory(StrEnum):
    ACADEMIC_TRANSCRIPT = "academic_transcript"
    PASSPORT = "passport"
    ENGLISH_TEST = "english_test"
    RECOMMENDATION_LETTER = "recommendation_letter"
    SOP = "sop"
    OTHER = "other"


class DocumentStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ApplicationStatus(StrEnum):
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    DOCUMENTS_REQUIRED = "documents_required"
    SHORTLISTED = "shortlisted"
    OFFER_RECEIVED = "offer_received"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class NotificationType(StrEnum):
    ACCOUNT_STATUS = "account_status"
    APPOINTMENT = "appointment"
    DOCUMENT = "document"
    APPLICATION = "application"
    SYSTEM = "system"
