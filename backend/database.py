import mysql.connector
from mysql.connector import Error
import os

class DatabaseManager:
    def __init__(self, host="localhost", user="root", password="12345678", database="sign_language_app"):
        self.host = host
        self.user = user
        self.password = password
        self.database = database
        self.connection = None

    def connect(self):
        """Kết nối tới MySQL Server."""
        try:
            self.connection = mysql.connector.connect(
                host=self.host,
                user=self.user,
                password=self.password,
                database=self.database
            )
            if self.connection.is_connected():
                return True
        except Error as e:
            print(f"Error connecting to MySQL: {e}")
            return False

    def close(self):
        """Đóng kết nối."""
        if self.connection and self.connection.is_connected():
            self.connection.close()

    def execute_query(self, query, params=None):
        """Thực thi câu lệnh SQL (INSERT, UPDATE, DELETE)."""
        cursor = None
        try:
            if not self.connection or not self.connection.is_connected():
                self.connect()
            cursor = self.connection.cursor()
            cursor.execute(query, params)
            self.connection.commit()
            return cursor.lastrowid
        except Error as e:
            print(f"Query Error: {e}")
            return None
        finally:
            if cursor: cursor.close()

    def fetch_all(self, query, params=None):
        """Lấy tất cả kết quả (SELECT)."""
        cursor = None
        try:
            if not self.connection or not self.connection.is_connected():
                self.connect()
            cursor = self.connection.cursor(dictionary=True)
            cursor.execute(query, params)
            return cursor.fetchall()
        except Error as e:
            print(f"Fetch Error: {e}")
            return []
        finally:
            if cursor: cursor.close()

    def init_db(self):
        """Khởi tạo cấu trúc Database nếu chưa có."""
        cursor = None
        try:
            # Kết nối không chọn DB để tạo DB trước
            temp_conn = mysql.connector.connect(
                host=self.host,
                user=self.user,
                password=self.password
            )
            cursor = temp_conn.cursor()
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {self.database}")
            temp_conn.commit()
            cursor.close()
            temp_conn.close()

            # Kết nối vào DB chính
            self.connect()
            cursor = self.connection.cursor()

            # Tạo bảng Users
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    user_id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(150) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    avatar VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Tạo bảng Categories
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS categories (
                    category_id INT AUTO_INCREMENT PRIMARY KEY,
                    category_name VARCHAR(100) NOT NULL
                )
            """)

            # Tạo bảng Lessons
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS lessons (
                    lesson_id INT AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(100) NOT NULL,
                    category_id INT,
                    video_url VARCHAR(255),
                    thumbnail VARCHAR(255),
                    difficulty VARCHAR(50),
                    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL
                )
            """)

            # ... (users, categories, lessons created above)

            # Quizzes
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS quizzes (
                    quiz_id INT AUTO_INCREMENT PRIMARY KEY,
                    lesson_id INT,
                    question TEXT NOT NULL,
                    option_1 VARCHAR(100),
                    option_2 VARCHAR(100),
                    option_3 VARCHAR(100),
                    option_4 VARCHAR(100),
                    correct_answer VARCHAR(100),
                    video_url VARCHAR(255),
                    thumbnail VARCHAR(255),
                    category VARCHAR(100),
                    difficulty VARCHAR(50),
                    FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id) ON DELETE CASCADE
                )
            """)

            # User Progress
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_progress (
                    progress_id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT,
                    lesson_id INT,
                    completed BOOLEAN DEFAULT FALSE,
                    score FLOAT DEFAULT 0,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                    FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id) ON DELETE CASCADE
                )
            """)

            # Streaks
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS streaks (
                    streak_id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT UNIQUE,
                    current_streak INT DEFAULT 0,
                    last_active_date DATE,
                    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
                )
            """)

            # Learning Results
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS learning_results (
                    result_id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT,
                    quiz_id INT,
                    selected_answer VARCHAR(100),
                    is_correct BOOLEAN,
                    score FLOAT,
                    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE
                )
            """)

            # Settings
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS settings (
                    setting_id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT UNIQUE,
                    text_size VARCHAR(20) DEFAULT 'medium',
                    contrast_mode BOOLEAN DEFAULT FALSE,
                    sound_enabled BOOLEAN DEFAULT TRUE,
                    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
                )
            """)
            
            # Recognition History (Already added in previous version, ensuring it's here)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS recognition_history (
                    history_id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT,
                    recognized_text VARCHAR(255),
                    confidence FLOAT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
                )
            """)

            self.connection.commit()
            print("[DB] Database initialized successfully.")
            self.seed_data()
            return True
        except Error as e:
            print(f"Init DB Error: {e}")
            return False
        finally:
            if cursor: cursor.close()

    def seed_data(self):
        """Thêm dữ liệu mẫu nếu bảng categories trống."""
        try:
            count = self.fetch_all("SELECT COUNT(*) as count FROM categories")[0]['count']
            if count == 0:
                categories = [
                    ('Greetings',), ('Daily Actions',), ('School',), ('Family',),
                    ('Emotion',), ('Food',), ('Numbers',), ('Colors',)
                ]
                cursor = self.connection.cursor()
                cursor.executemany("INSERT INTO categories (category_name) VALUES (%s)", categories)
                self.connection.commit()
                cursor.close()
                print("[DB] Sample categories seeded.")
        except Error as e:
            print(f"Seed Error: {e}")

# Singleton instance
db = DatabaseManager()
