from app.schemas.application import (
    ApplicationCreate,
    ApplicationDetailResponse,
    ApplicationHistoryResponse,
    ApplicationListResponse,
    ApplicationResponse,
    ApplicationStatusTransitionRequest,
)
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentListResponse,
    AppointmentResponse,
    AppointmentStatusUpdate,
    AvailabilityCreate,
    AvailabilityResponse,
)
from app.schemas.auth import (
    RefreshTokenRequest,
    TokenPayload,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
)
from app.schemas.counselor_note import (
    CounselorNoteCreate,
    CounselorNoteListResponse,
    CounselorNoteResponse,
)
from app.schemas.country import (
    CountryCreate,
    CountryListResponse,
    CountryResponse,
    CountryUpdate,
)
from app.schemas.course import (
    CourseCreate,
    CourseListResponse,
    CourseResponse,
    CourseUpdate,
)
from app.schemas.document import (
    DocumentCategory,
    DocumentListResponse,
    DocumentResponse,
    DocumentReviewRequest,
)
from app.schemas.matching import (
    CourseMatchResponse,
    CourseMatchResult,
)
from app.schemas.notification import (
    NotificationListResponse,
    NotificationResponse,
)
from app.schemas.shortlist import (
    ShortlistCreate,
    ShortlistListResponse,
    ShortlistResponse,
)
from app.schemas.student import (
    StudentProfileCreate,
    StudentProfileResponse,
    StudentProfileUpdate,
)
from app.schemas.university import (
    UniversityCreate,
    UniversityListResponse,
    UniversityResponse,
    UniversityUpdate,
)
from app.schemas.user import (
    UserCreateInternal,
    UserListResponse,
    UserResponse,
    UserStatusUpdateRequest,
)

__all__ = [
    "UserRegisterRequest",
    "UserLoginRequest",
    "TokenResponse",
    "RefreshTokenRequest",
    "TokenPayload",
    "UserResponse",
    "UserCreateInternal",
    "UserStatusUpdateRequest",
    "UserListResponse",
    "StudentProfileCreate",
    "StudentProfileUpdate",
    "StudentProfileResponse",
    "CountryCreate",
    "CountryUpdate",
    "CountryResponse",
    "CountryListResponse",
    "UniversityCreate",
    "UniversityUpdate",
    "UniversityResponse",
    "UniversityListResponse",
    "CourseCreate",
    "CourseUpdate",
    "CourseResponse",
    "CourseListResponse",
    "CourseMatchResult",
    "CourseMatchResponse",
    "ShortlistCreate",
    "ShortlistResponse",
    "ShortlistListResponse",
    "AvailabilityCreate",
    "AvailabilityResponse",
    "AppointmentCreate",
    "AppointmentResponse",
    "AppointmentStatusUpdate",
    "AppointmentListResponse",
    "DocumentReviewRequest",
    "DocumentResponse",
    "DocumentListResponse",
    "DocumentCategory",
    "ApplicationCreate",
    "ApplicationResponse",
    "ApplicationStatusTransitionRequest",
    "ApplicationHistoryResponse",
    "ApplicationDetailResponse",
    "ApplicationListResponse",
    "NotificationResponse",
    "NotificationListResponse",
    "CounselorNoteCreate",
    "CounselorNoteResponse",
    "CounselorNoteListResponse",
]
