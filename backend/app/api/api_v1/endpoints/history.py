from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from datetime import datetime, date, timedelta

from app.db.session import get_db
from app.schemas.history import RecognitionHistory, RecognitionStats

router = APIRouter()

@router.get("/", response_model=List[RecognitionHistory])
def read_history(
    type: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    query = "SELECT * FROM recognition_history WHERE user_id = :user_id"
    params = {"user_id": 1} # Mock user_id 1 for now
    
    if type and type != "All":
        query += " AND type = :type"
        params["type"] = type.upper()
    
    if search:
        query += " AND recognized_text LIKE :search"
        params["search"] = f"%{search}%"
        
    query += " ORDER BY created_at DESC LIMIT :limit OFFSET :skip"
    params["limit"] = limit
    params["skip"] = skip
    
    result = db.execute(text(query), params).mappings().all()
    return result

@router.get("/stats", response_model=RecognitionStats)
def read_history_stats(db: Session = Depends(get_db)):
    today = date.today()
    yesterday = today - timedelta(days=1)
    
    # Translations today
    today_query = "SELECT COUNT(*) as count, AVG(confidence) as avg_conf FROM recognition_history WHERE user_id = :u AND DATE(created_at) = :d"
    today_result = db.execute(text(today_query), {"u": 1, "d": today}).mappings().first()
    
    # Translations yesterday
    yesterday_query = "SELECT COUNT(*) as count FROM recognition_history WHERE user_id = :u AND DATE(created_at) = :d"
    yesterday_count = db.execute(text(yesterday_query), {"u": 1, "d": yesterday}).mappings().first()["count"]
    
    today_count = today_result["count"] or 0
    avg_conf = (today_result["avg_conf"] or 0.0) * 100
    increase = today_count - yesterday_count
    
    return {
        "today_count": today_count,
        "avg_confidence": round(avg_conf, 1),
        "increase_from_yesterday": increase
    }

@router.patch("/{history_id}/bookmark")
def toggle_bookmark(history_id: int, db: Session = Depends(get_db)):
    # Get current status
    item = db.execute(text("SELECT is_bookmarked FROM recognition_history WHERE history_id = :id"), {"id": history_id}).mappings().first()
    if not item:
        raise HTTPException(status_code=404, detail="History item not found")
    
    new_status = not item["is_bookmarked"]
    db.execute(
        text("UPDATE recognition_history SET is_bookmarked = :s WHERE history_id = :id"),
        {"s": new_status, "id": history_id}
    )
    db.commit()
    return {"status": "success", "is_bookmarked": new_status}

@router.delete("/{history_id}")
def delete_history_item(history_id: int, db: Session = Depends(get_db)):
    db.execute(text("DELETE FROM recognition_history WHERE history_id = :id"), {"id": history_id})
    db.commit()
    return {"status": "success"}
