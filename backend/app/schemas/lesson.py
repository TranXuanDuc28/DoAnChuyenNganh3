from pydantic import BaseModel
from typing import Optional

class LessonBase(BaseModel):
    title: str
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    video_url: Optional[str] = None
    difficulty: Optional[str] = "Basic"
    category_id: int

class LessonCreate(LessonBase):
    pass

class Lesson(LessonBase):
    lesson_id: int

    class Config:
        from_attributes = True # Cho phép Pydantic đọc dữ liệu từ SQLAlchemy models
