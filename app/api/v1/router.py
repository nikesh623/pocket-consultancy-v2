from fastapi import APIRouter

from app.api.v1.endpoints import (
    applications,
    appointments,
    auth,
    countries,
    courses,
    documents,
    notifications,
    students,
    universities,
    users,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(students.router)
api_router.include_router(countries.router)
api_router.include_router(universities.router)
api_router.include_router(courses.router)
api_router.include_router(appointments.router)
api_router.include_router(documents.router)
api_router.include_router(applications.router)
api_router.include_router(notifications.router)
