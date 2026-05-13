from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
import sqlite3
import hashlib
import jwt
import datetime
import sys
import io

# Fix encoding issue on Windows
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

from fastapi.middleware.cors import CORSMiddleware
import mysql.connector # Cần chạy: pip install mysql-connector-python
from mysql.connector import Error

app = FastAPI()

# --- Cấu hình CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "signlink_secret_key_v1" # Trong thực tế nên để ở .env

# --- Cấu hình Database ---
# Set USE_MYSQL = True nếu bạn muốn dùng MySQL, False để dùng SQLite (mặc định)
USE_MYSQL = True

MYSQL_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'root',
    'database': 'doan'
}

# --- Database Setup ---
def get_db_connection():
    if USE_MYSQL:
        try:
            conn = mysql.connector.connect(**MYSQL_CONFIG)
            return conn
        except Error as e:
            print(f"Error connecting to MySQL: {e}")
            return None
    else:
        conn = sqlite3.connect('users.db')
        conn.row_factory = sqlite3.Row
        return conn

def init_db():
    conn = get_db_connection()
    if not conn: return
    
    if USE_MYSQL:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                auto_start TINYINT DEFAULT 1
            )
        ''')
    else:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                phone TEXT,
                auto_start INTEGER DEFAULT 1
            )
        ''')
    conn.commit()
    conn.close()

init_db()

# --- Models ---
class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class EditProfileRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    auto_start: Optional[bool] = None

# --- Helpers ---
def hash_password(password: str):
    return hashlib.sha256(password.encode()).hexdigest()

def create_token(user_id: int):
    payload = {
        "user_id": user_id,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

# --- Endpoints ---

@app.post("/register")
async def register(user: UserRegister):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Database connection failed")
    hashed = hash_password(user.password)
    try:
        if USE_MYSQL:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO users (full_name, email, password) VALUES (%s, %s, %s)",
                (user.full_name, user.email, hashed)
            )
            user_id = cursor.lastrowid
        else:
            cursor = conn.execute(
                "INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)",
                (user.full_name, user.email, hashed)
            )
            user_id = cursor.lastrowid
            
        conn.commit()
        token = create_token(user_id)
        return {"status": "success", "message": "User registered", "token": token}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@app.post("/login")
async def login(user: UserLogin):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Database connection failed")
    hashed = hash_password(user.password)
    
    if USE_MYSQL:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE email = %s AND password = %s", (user.email, hashed))
        db_user = cursor.fetchone()
    else:
        db_user = conn.execute(
            "SELECT * FROM users WHERE email = ? AND password = ?",
            (user.email, hashed)
        ).fetchone()
        
    conn.close()

    if db_user:
        token = create_token(db_user['id'])
        return {
            "status": "success", 
            "token": token,
            "user": {
                "id": db_user['id'],
                "full_name": db_user['full_name'],
                "email": db_user['email']
            }
        }
    else:
        raise HTTPException(status_code=401, detail="Invalid email or password")

@app.get("/get-profile")
async def get_profile(user_id: int):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Database connection failed")
    
    if USE_MYSQL:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, full_name, email, phone, auto_start FROM users WHERE id = %s", (user_id,))
        db_user = cursor.fetchone()
    else:
        db_user = conn.execute("SELECT id, full_name, email, phone, auto_start FROM users WHERE id = ?", (user_id,)).fetchone()
        if db_user:
            db_user = dict(db_user)
            
    conn.close()
    
    if db_user:
        # Chuyển đổi auto_start sang boolean nếu là int từ DB
        db_user['auto_start'] = bool(db_user.get('auto_start', 1))
        return {"status": "success", "user": db_user}
    else:
        raise HTTPException(status_code=404, detail="User not found")

@app.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    conn = get_db_connection()
    if USE_MYSQL:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = %s", (request.email,))
        db_user = cursor.fetchone()
    else:
        db_user = conn.execute("SELECT * FROM users WHERE email = ?", (request.email,)).fetchone()
    conn.close()
    
    if db_user:
        return {"status": "success", "message": "Recovery link sent to " + request.email}
    else:
        raise HTTPException(status_code=404, detail="Email not found")

@app.post("/edit-profile")
async def edit_profile(request: EditProfileRequest, user_id: int):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Database connection failed")
    
    update_data = []
    params = []
    
    if request.full_name:
        update_data.append("full_name = %s" if USE_MYSQL else "full_name = ?")
        params.append(request.full_name)
    if request.email:
        update_data.append("email = %s" if USE_MYSQL else "email = ?")
        params.append(request.email)
    if request.phone:
        update_data.append("phone = %s" if USE_MYSQL else "phone = ?")
        params.append(request.phone)
    if request.auto_start is not None:
        update_data.append("auto_start = %s" if USE_MYSQL else "auto_start = ?")
        params.append(1 if request.auto_start else 0)
        
    if not update_data:
        conn.close()
        return {"status": "no_change"}
    
    params.append(user_id)
    placeholder = "%s" if USE_MYSQL else "?"
    query = f"UPDATE users SET {', '.join(update_data)} WHERE id = {placeholder}"
    
    if USE_MYSQL:
        cursor = conn.cursor()
        cursor.execute(query, tuple(params))
    else:
        conn.execute(query, tuple(params))
        
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": "Profile updated"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
