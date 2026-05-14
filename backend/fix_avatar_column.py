import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

MYSQL_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '123456789',
    'database': 'sign_language_app'
}

def fix_avatar_column():
    try:
        conn = mysql.connector.connect(**MYSQL_CONFIG)
        cursor = conn.cursor()
        
        # Kiểm tra sự tồn tại của cột avatar
        cursor.execute("SHOW COLUMNS FROM users LIKE 'avatar'")
        column = cursor.fetchone()
        
        if column:
            print("Changing 'avatar' column type to LONGTEXT...")
            cursor.execute("ALTER TABLE users MODIFY COLUMN avatar LONGTEXT")
        else:
            print("Adding 'avatar' column as LONGTEXT...")
            cursor.execute("ALTER TABLE users ADD COLUMN avatar LONGTEXT")
            
        conn.commit()
        print("Database update completed successfully.")
        conn.close()
    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    fix_avatar_column()
