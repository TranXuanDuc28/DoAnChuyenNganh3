from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Any
import random

from app.api import deps
from app.db.session import get_db

router = APIRouter()

@router.get("/generate", response_model=List[Any])
def generate_quiz(
    category_id: int = Query(None),
    count: int = 10,
    db: Session = Depends(get_db)
):
    """
    Fetch quiz questions from the real 'quizzes' table.
    """
    # If category_id is provided, we might want to get the category name first
    category_name = None
    if category_id:
        cat_result = db.execute(text(f"SELECT category_name FROM categories WHERE category_id = {category_id}")).fetchone()
        if cat_result:
            category_name = cat_result[0]

    # Build query
    query_str = "SELECT question, option_1, option_2, option_3, option_4, correct_answer, video_url, difficulty, category FROM quizzes"
    
    # Filter by category if provided
    if category_name:
        # Match by category name string as suggested by the schema
        query_str += f" WHERE category = '{category_name}'"
    
    # Pick random count
    query_str += f" ORDER BY RAND() LIMIT {count}"
    
    results = db.execute(text(query_str)).fetchall()
    
    quiz_data = []
    for row in results:
        question, o1, o2, o3, o4, correct, video, diff, cat = row
        
        # Prepare options list
        options = [o1, o2, o3, o4]
        # Remove empty options if any
        options = [o for o in options if o]
        
        quiz_data.append({
            "question_text": question,
            "video_url": video,
            "options": options,
            "correct_answer": correct,
            "difficulty": diff or "Basic",
            "topic": cat
        })
        
    return quiz_data
