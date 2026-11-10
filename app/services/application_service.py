from typing import Any

from pymongo.asynchronous.database import AsyncDatabase

from app.core.exceptions import AuthorizationError, DomainValidationError, NotFoundError
from app.models.enums import ApplicationStatus, NotificationType, UserRole
from app.repositories.application_repo import ApplicationRepository
from app.repositories.course_repo import CourseRepository
from app.repositories.user_repo import UserRepository
from app.schemas.application import ApplicationCreate, ApplicationStatusTransitionRequest
from app.services.notification_service import NotificationService
from app.utils.reference_generator import generate_application_reference

# State transition matrix
ALLOWED_TRANSITIONS = {
    ApplicationStatus.SUBMITTED: [
        ApplicationStatus.UNDER_REVIEW,
        ApplicationStatus.WITHDRAWN,
    ],
    ApplicationStatus.UNDER_REVIEW: [
        ApplicationStatus.DOCUMENTS_REQUIRED,
        ApplicationStatus.SHORTLISTED,
        ApplicationStatus.REJECTED,
        ApplicationStatus.WITHDRAWN,
    ],
    ApplicationStatus.DOCUMENTS_REQUIRED: [
        ApplicationStatus.UNDER_REVIEW,
        ApplicationStatus.REJECTED,
        ApplicationStatus.WITHDRAWN,
    ],
    ApplicationStatus.SHORTLISTED: [
        ApplicationStatus.OFFER_RECEIVED,
        ApplicationStatus.REJECTED,
        ApplicationStatus.WITHDRAWN,
    ],
    ApplicationStatus.OFFER_RECEIVED: [
        ApplicationStatus.WITHDRAWN,
    ],
    ApplicationStatus.REJECTED: [],
    ApplicationStatus.WITHDRAWN: [],
}


class ApplicationService:
    def __init__(self, db: AsyncDatabase):
        self.db = db
        self.app_repo = ApplicationRepository(db)
        self.course_repo = CourseRepository(db)
        self.user_repo = UserRepository(db)
        self.notification_service = NotificationService(db)

    async def submit_application(self, student_id: str, data: ApplicationCreate) -> dict[str, Any]:
        course = await self.course_repo.find_by_id(data.course_id)
        if not course:
            raise NotFoundError("Course", data.course_id)

        reference = generate_application_reference()

        app_doc = {
            "reference_number": reference,
            "student_id": str(student_id),
            "course_id": str(data.course_id),
            "status": ApplicationStatus.SUBMITTED.value,
            "remarks": data.remarks,
        }

        app_id = await self.app_repo.insert_one(app_doc)
        app_doc["_id"] = app_id

        # Insert initial history entry
        await self.app_repo.update_status_with_history(
            application_id=app_id,
            previous_status=None,
            new_status=ApplicationStatus.SUBMITTED,
            changed_by_user_id=student_id,
            changed_by_role=UserRole.STUDENT.value,
            remarks="Application initially submitted by student.",
        )

        # Notify student
        await self.notification_service.send_notification(
            user_id=student_id,
            title="Application Submitted",
            message=f"Application {reference} for '{course['name']}' has been submitted successfully.",
            notification_type=NotificationType.APPLICATION,
        )

        return app_doc

    async def transition_status(
        self,
        application_id: str,
        transition_data: ApplicationStatusTransitionRequest,
        requesting_user: dict[str, Any],
    ) -> dict[str, Any]:
        application = await self.app_repo.find_by_id(application_id)
        if not application:
            raise NotFoundError("Application", application_id)

        req_role = requesting_user.get("role")
        req_id = str(requesting_user.get("_id"))
        curr_status = ApplicationStatus(application["status"])
        new_status = transition_data.new_status

        # Permission rules:
        # Students can only withdraw their own application
        if req_role == UserRole.STUDENT.value:
            if application.get("student_id") != req_id:
                raise AuthorizationError("Students cannot modify applications belonging to others.")
            if new_status != ApplicationStatus.WITHDRAWN:
                raise AuthorizationError(
                    "Students are only permitted to withdraw their application."
                )

        # Non-students must have counselor or admin role to progress applications
        if req_role not in [UserRole.COUNSELOR.value, UserRole.ADMIN.value, UserRole.STUDENT.value]:
            raise AuthorizationError("Your role does not permit updating application statuses.")

        # Transition validation (Admin can override transitions if necessary)
        if req_role != UserRole.ADMIN.value:
            allowed = ALLOWED_TRANSITIONS.get(curr_status, [])
            if new_status not in allowed:
                raise DomainValidationError(
                    f"Invalid status transition from '{curr_status.value}' to '{new_status.value}'."
                )

        success = await self.app_repo.update_status_with_history(
            application_id=application_id,
            previous_status=curr_status,
            new_status=new_status,
            changed_by_user_id=req_id,
            changed_by_role=req_role,
            remarks=transition_data.remarks,
        )
        if not success:
            raise NotFoundError("Application", application_id)

        # Notify student of status transition
        course = await self.course_repo.find_by_id(application["course_id"])
        course_name = course.get("name", "Course") if course else "Course"
        msg = f"Your application ({application['reference_number']}) for '{course_name}' status updated to '{new_status.value}'."
        if transition_data.remarks:
            msg += f" Remarks: {transition_data.remarks}"

        await self.notification_service.send_notification(
            user_id=application["student_id"],
            title="Application Status Changed",
            message=msg,
            notification_type=NotificationType.APPLICATION,
        )

        return await self.app_repo.find_by_id(application_id)

    async def get_application_detail(
        self, application_id: str, requesting_user: dict[str, Any]
    ) -> dict[str, Any]:
        application = await self.app_repo.find_by_id(application_id)
        if not application:
            raise NotFoundError("Application", application_id)

        req_role = requesting_user.get("role")
        req_id = str(requesting_user.get("_id"))

        if req_role == UserRole.STUDENT.value and application.get("student_id") != req_id:
            raise AuthorizationError("You are not authorized to view this application.")

        history = await self.app_repo.get_history(application_id)
        course = await self.course_repo.find_by_id(application["course_id"])

        return {
            "application": application,
            "history": history,
            "course": course,
        }

    async def list_applications(
        self,
        requesting_user: dict[str, Any],
        student_id: str | None = None,
        status: ApplicationStatus | None = None,
        page: int = 1,
        size: int = 50,
    ) -> dict[str, Any]:
        req_role = requesting_user.get("role")
        req_id = str(requesting_user.get("_id"))

        skip = (page - 1) * size

        if req_role == UserRole.STUDENT.value:
            items = await self.app_repo.list_by_student(req_id)
            return {"items": items, "total": len(items), "page": page, "size": size}

        if student_id:
            items = await self.app_repo.list_by_student(student_id)
            return {"items": items, "total": len(items), "page": page, "size": size}

        items = await self.app_repo.list_applications(status=status, skip=skip, limit=size)
        total = await self.app_repo.count_applications(status=status)
        return {"items": items, "total": total, "page": page, "size": size}
