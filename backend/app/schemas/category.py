from pydantic import BaseModel
from typing import Optional, List

class CategoryBase(BaseModel):
    category_name: str
    description: Optional[str] = None
    icon: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    category_id: int
    lesson_count: Optional[int] = 0

    class Config:
        from_attributes = True
