from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from app.db.session import get_db
from app.schemas.lesson import Lesson

router = APIRouter()

@router.get("/", response_model=List[Lesson])
def read_lessons(
    category_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = "SELECT * FROM lessons"
    params = {}
    if category_id:
        query += " WHERE category_id = :cat_id"
        params["cat_id"] = category_id
    
    result = db.execute(text(query), params).mappings().all()
    return result

@router.get("/{lesson_id}", response_model=Lesson)
def read_lesson(lesson_id: int, db: Session = Depends(get_db)):
    result = db.execute(
        text("SELECT * FROM lessons WHERE lesson_id = :id"), 
        {"id": lesson_id}
    ).mappings().first()
    
    if not result:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return result
