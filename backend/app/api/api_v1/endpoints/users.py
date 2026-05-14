from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.api import deps
from app.db.session import get_db
from app.schemas.user import UserResponse
from typing import Optional
from pydantic import BaseModel, EmailStr

router = APIRouter()

class EditProfileRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    auto_start: Optional[bool] = None
    avatar: Optional[str] = None

@router.get("/me", response_model=UserResponse)
def get_me(current_user=Depends(deps.get_current_user)):
    """
    Lấy thông tin người dùng hiện tại
    """
    return current_user

@router.get("/profile")
def get_profile(user_id: int, db: Session = Depends(get_db)):
    query = text("SELECT user_id, name as full_name, email, phone, auto_start FROM users WHERE user_id = :user_id")
    user = db.execute(query, {"user_id": user_id}).mappings().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Chuyển đổi thành dict để có thể chỉnh sửa nếu cần
    user_dict = dict(user)
    # Đảm bảo auto_start là boolean
    user_dict['auto_start'] = bool(user_dict.get('auto_start', 1))
    
    return {"status": "success", "user": user_dict}

@router.post("/profile")
def edit_profile(request: EditProfileRequest, user_id: int, db: Session = Depends(get_db)):
    update_data = []
    params = {"user_id": user_id}
    
    if request.full_name:
        update_data.append("name = :name")
        params["name"] = request.full_name
    if request.email:
        update_data.append("email = :email")
        params["email"] = request.email
    if request.phone:
        update_data.append("phone = :phone")
        params["phone"] = request.phone
    if request.auto_start is not None:
        update_data.append("auto_start = :auto_start")
        params["auto_start"] = 1 if request.auto_start else 0
    if request.avatar:
        update_data.append("avatar = :avatar")
        params["avatar"] = request.avatar
        
    if not update_data:
        return {"status": "no_change"}
    
    query = text(f"UPDATE users SET {', '.join(update_data)} WHERE user_id = :user_id")
    db.execute(query, params)
    db.commit()
    
    return {"status": "success", "message": "Profile updated"}
