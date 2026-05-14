import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

# Lấy cấu hình từ biến môi trường (hoặc fix cứng theo project nếu cần)
# Giả định dùng MySQL theo auth_api.py
MYSQL_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '123456789',
    'database': 'sign_language_app'
}

def migrate_db():
    try:
        conn = mysql.connector.connect(**MYSQL_CONFIG)
        cursor = conn.cursor()
        
        # Kiểm tra cột phone
        cursor.execute("SHOW COLUMNS FROM users LIKE 'phone'")
        if not cursor.fetchone():
            print("Adding 'phone' column...")
            cursor.execute("ALTER TABLE users ADD COLUMN phone VARCHAR(20)")
        
        # Kiểm tra cột auto_start
        cursor.execute("SHOW COLUMNS FROM users LIKE 'auto_start'")
        if not cursor.fetchone():
            print("Adding 'auto_start' column...")
            cursor.execute("ALTER TABLE users ADD COLUMN auto_start TINYINT DEFAULT 1")
            
        conn.commit()
        print("Database migration completed successfully.")
        conn.close()
    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate_db()
