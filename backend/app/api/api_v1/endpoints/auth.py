from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.schemas.user import UserCreate, UserResponse, Token
from app.core.security import get_password_hash, verify_password, create_access_token
from datetime import datetime

router = APIRouter()

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # 1. Kiểm tra email đã tồn tại chưa
    check_query = text("SELECT * FROM users WHERE email = :email")
    existing_user = db.execute(check_query, {"email": user_in.email}).mappings().first()
    
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email này đã được sử dụng."
        )
    
    # 2. Mã hóa mật khẩu
    hashed_password = get_password_hash(user_in.password)
    
    # 3. Thêm vào database
    insert_query = text("""
        INSERT INTO users (name, email, password, created_at)
        VALUES (:name, :email, :password, :created_at)
    """)
    db.execute(insert_query, {
        "name": user_in.name,
        "email": user_in.email,
        "password": hashed_password,
        "created_at": datetime.utcnow()
    })
    db.commit()
    
    # 4. Lấy lại user vừa tạo để trả về
    user_query = text("SELECT * FROM users WHERE email = :email")
    new_user = db.execute(user_query, {"email": user_in.email}).mappings().first()
    
    return new_user

@router.post("/login")
def login(user_in: UserCreate, db: Session = Depends(get_db)):
    # 1. Tìm user theo email (Lưu ý: UserCreate dùng chung cho nhanh hoặc tạo Login schema)
    query = text("SELECT * FROM users WHERE email = :email")
    user = db.execute(query, {"email": user_in.email}).mappings().first()
    
    if not user or not verify_password(user_in.password, user['password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không chính xác.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 2. Tạo Token
    access_token = create_access_token(subject=user['email'])
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user['user_id'],
            "name": user['name'],
            "email": user['email']
        }
    }
