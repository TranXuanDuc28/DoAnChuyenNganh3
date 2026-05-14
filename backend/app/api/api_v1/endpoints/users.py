from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.user import UserResponse

router = APIRouter()

@router.get("/me", response_model=UserResponse)
def get_me(current_user=Depends(deps.get_current_user)):
    """
    Lấy thông tin người dùng hiện tại
    """
    return current_user
