from fastapi import APIRouter
from app.api.api_v1.endpoints import auth, categories, lessons, recognition, users, quizzes

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(lessons.router, prefix="/lessons", tags=["lessons"])
api_router.include_router(recognition.router, prefix="/recognition", tags=["recognition"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(quizzes.router, prefix="/quizzes", tags=["quizzes"])
