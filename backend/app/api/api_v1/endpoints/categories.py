from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from app.db.session import get_db
from app.schemas.category import Category

router = APIRouter()

@router.get("/", response_model=List[Category])
def read_categories(db: Session = Depends(get_db)):
    query = """
        SELECT c.*, COUNT(l.lesson_id) as lesson_count 
        FROM categories c
        LEFT JOIN lessons l ON c.category_id = l.category_id
        GROUP BY c.category_id
    """
    # Note: Using text directly for now as per previous logic
    result = db.execute(text(query)).mappings().all()
    return result
