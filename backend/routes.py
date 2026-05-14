from fastapi import APIRouter
from database import db

router = APIRouter(prefix="/api")

@router.get("/categories")
async def get_categories():
    """Lấy danh sách danh mục kèm theo số lượng bài học."""
    query = """
        SELECT c.*, COUNT(l.lesson_id) as lesson_count 
        FROM categories c
        LEFT JOIN lessons l ON c.category_id = l.category_id
        GROUP BY c.category_id
    """
    return db.fetch_all(query)

@router.get("/lessons")
async def get_lessons(category_id: int = None):
    """Lấy danh sách bài học, có thể lọc theo category_id."""
    if category_id:
        return db.fetch_all("SELECT * FROM lessons WHERE category_id = %s", (category_id,))
    return db.fetch_all("SELECT * FROM lessons")

@router.get("/lessons/{lesson_id}")
async def get_lesson_detail(lesson_id: int):
    """Lấy chi tiết một bài học."""
    result = db.fetch_all("SELECT * FROM lessons WHERE lesson_id = %s", (lesson_id,))
    return result[0] if result else None

@router.get("/quizzes/{lesson_id}")
async def get_quizzes_by_lesson(lesson_id: int):
    """Lấy danh sách câu đố của một bài học."""
    return db.fetch_all("SELECT * FROM quizzes WHERE lesson_id = %s", (lesson_id,))

@router.get("/history/{user_id}")
async def get_user_history(user_id: int):
    """Lấy lịch sử nhận diện của người dùng."""
    return db.fetch_all("SELECT * FROM recognition_history WHERE user_id = %s ORDER BY created_at DESC LIMIT 50", (user_id,))
