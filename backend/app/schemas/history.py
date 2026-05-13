from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class RecognitionHistoryBase(BaseModel):
    type: str
    recognized_text: str
    confidence: float
    thumbnail: Optional[str] = None
    video_url: Optional[str] = None
    is_bookmarked: bool = False

class RecognitionHistoryCreate(RecognitionHistoryBase):
    user_id: int

class RecognitionHistory(RecognitionHistoryBase):
    history_id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class RecognitionStats(BaseModel):
    today_count: int
    avg_confidence: float
    increase_from_yesterday: int
