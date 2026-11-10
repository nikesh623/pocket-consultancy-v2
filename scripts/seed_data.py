import asyncio
import os
import sys
from datetime import UTC, datetime

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import get_settings
from app.core.security import hash_password
from app.database.connection import close_mongo_connection, connect_to_mongo, get_database
from app.models.enums import AccountStatus, StudyLevel, UserRole

settings = get_settings()


async def seed() -> None:
    print("Connecting to database for seeding...")
    await connect_to_mongo()
    db = get_database()
    now = datetime.now(UTC)

    # 1. Staff users
    users_col = db["users"]
    staff_users = [
        {
            "email": "counselor@pocketconsultancy.com",
            "hashed_password": hash_password("CounselorPass123!"),
            "full_name": "Sarah Jenkins (Senior Counselor)",
            "phone_number": "+1-555-0101",
            "role": UserRole.COUNSELOR.value,
            "account_status": AccountStatus.ACTIVE.value,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "email": "officer@pocketconsultancy.com",
            "hashed_password": hash_password("OfficerPass123!"),
            "full_name": "Marcus Vance (Documentation Officer)",
            "phone_number": "+1-555-0102",
            "role": UserRole.DOCUMENTATION_OFFICER.value,
            "account_status": AccountStatus.ACTIVE.value,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
    ]

    for u in staff_users:
        await users_col.update_one(
            {"email": u["email"]},
            {"$setOnInsert": u},
            upsert=True,
        )
    print("Staff accounts verified.")

    # 2. Countries
    countries_col = db["countries"]
    demo_countries = [
        {
            "name": "United States",
            "code": "US",
            "description": "Top research universities and STEM programs.",
            "currency": "USD",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "name": "United Kingdom",
            "code": "UK",
            "description": "Historic universities and 1-year master's degrees.",
            "currency": "GBP",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "name": "Canada",
            "code": "CA",
            "description": "Post-graduation work permits and high quality of life.",
            "currency": "CAD",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "name": "Australia",
            "code": "AU",
            "description": "World-class education and vibrant multicultural cities.",
            "currency": "AUD",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "name": "Germany",
            "code": "DE",
            "description": "Renowned engineering and tuition-free public universities.",
            "currency": "EUR",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
    ]

    country_map = {}
    for c in demo_countries:
        res = await countries_col.find_one_and_update(
            {"code": c["code"]},
            {"$setOnInsert": c},
            upsert=True,
            return_document=True,
        )
        country_map[c["code"]] = str(res["_id"])
    print("Countries seeded.")

    # 3. Universities
    univ_col = db["universities"]
    demo_univs = [
        {
            "name": "Stanford University",
            "country_id": country_map["US"],
            "city": "Stanford, CA",
            "website": "https://stanford.edu",
            "description": "Leading global research university.",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "name": "University of Oxford",
            "country_id": country_map["UK"],
            "city": "Oxford",
            "website": "https://ox.ac.uk",
            "description": "Collegiate research university.",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "name": "University of Toronto",
            "country_id": country_map["CA"],
            "city": "Toronto, ON",
            "website": "https://utoronto.ca",
            "description": "Canada's top research institution.",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "name": "University of Melbourne",
            "country_id": country_map["AU"],
            "city": "Melbourne, VIC",
            "website": "https://unimelb.edu.au",
            "description": "Australia's leading university.",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "name": "Technical University of Munich",
            "country_id": country_map["DE"],
            "city": "Munich",
            "website": "https://tum.de",
            "description": "Excellence in engineering and technology.",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
    ]

    univ_map = {}
    for u in demo_univs:
        res = await univ_col.find_one_and_update(
            {"name": u["name"]},
            {"$setOnInsert": u},
            upsert=True,
            return_document=True,
        )
        univ_map[u["name"]] = str(res["_id"])
    print("Universities seeded.")

    # 4. Courses
    courses_col = db["courses"]
    demo_courses = [
        {
            "name": "MSc Computer Science & Artificial Intelligence",
            "university_id": univ_map["Stanford University"],
            "country_id": country_map["US"],
            "study_level": StudyLevel.POSTGRADUATE.value,
            "duration_months": 24,
            "tuition_fee": 58000.0,
            "currency": "USD",
            "min_academic_score": 85.0,
            "entry_requirements": "BSc in CS or related STEM field with minimum GPA 3.5 or 85%.",
            "description": "Cutting-edge curriculum covering machine learning, robotics, and distributed systems.",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "name": "MSc Advanced Computer Science",
            "university_id": univ_map["University of Oxford"],
            "country_id": country_map["UK"],
            "study_level": StudyLevel.POSTGRADUATE.value,
            "duration_months": 12,
            "tuition_fee": 38000.0,
            "currency": "GBP",
            "min_academic_score": 80.0,
            "entry_requirements": "First class undergraduate degree in computer science or mathematics.",
            "description": "Intensive master's focusing on computation theory, algorithms, and verification.",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "name": "BSc Data Science & Computing",
            "university_id": univ_map["University of Toronto"],
            "country_id": country_map["CA"],
            "study_level": StudyLevel.UNDERGRADUATE.value,
            "duration_months": 48,
            "tuition_fee": 42000.0,
            "currency": "CAD",
            "min_academic_score": 75.0,
            "entry_requirements": "High school diploma with calculus and advanced functions.",
            "description": "Comprehensive foundation in statistical models, big data processing, and software.",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "name": "Master of Information Technology",
            "university_id": univ_map["University of Melbourne"],
            "country_id": country_map["AU"],
            "study_level": StudyLevel.POSTGRADUATE.value,
            "duration_months": 24,
            "tuition_fee": 46000.0,
            "currency": "AUD",
            "min_academic_score": 70.0,
            "entry_requirements": "Undergraduate degree in any discipline with programming prerequisite.",
            "description": "Industry-accredited program for tech careers and software management.",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "name": "MSc Software Engineering & Cloud Computing",
            "university_id": univ_map["Technical University of Munich"],
            "country_id": country_map["DE"],
            "study_level": StudyLevel.POSTGRADUATE.value,
            "duration_months": 24,
            "tuition_fee": 6000.0,
            "currency": "EUR",
            "min_academic_score": 75.0,
            "entry_requirements": "Bachelor in Informatics with formal methods and systems coursework.",
            "description": "Tuition-subsidized program focused on enterprise architecture and cloud platforms.",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        },
    ]

    for c in demo_courses:
        await courses_col.update_one(
            {"name": c["name"], "university_id": c["university_id"]},
            {"$setOnInsert": c},
            upsert=True,
        )
    print("Courses seeded successfully.")

    await close_mongo_connection()
    print("Seeding completed successfully.")


if __name__ == "__main__":
    asyncio.run(seed())
