import json
import os
from database import db

def import_data():
    try:
        # 1. Load data
        lessons_path = "archive/lessons.json"
        quizzes_path = "archive/quizzes.json"

        if not os.path.exists(lessons_path) or not os.path.exists(quizzes_path):
            print("[Error] Files not found in archive/")
            return

        with open(lessons_path, 'r', encoding='utf-8') as f:
            lessons_data = json.load(f)
        
        with open(quizzes_path, 'r', encoding='utf-8') as f:
            quizzes_data = json.load(f)

        print(f"[Info] Found {len(lessons_data)} lessons and {len(quizzes_data)} quizzes.")

        # 2. Sync Categories
        current_categories = {c['category_name']: c['category_id'] for c in db.fetch_all("SELECT * FROM categories")}
        
        for item in lessons_data:
            cat_name = item.get('category')
            if cat_name and cat_name not in current_categories:
                print(f"[DB] Adding new category: {cat_name}")
                new_id = db.execute_query("INSERT INTO categories (category_name) VALUES (%s)", (cat_name,))
                current_categories[cat_name] = new_id

        # 3. Insert Lessons
        # We'll map video_url to lesson_id for quiz mapping
        video_to_lesson_id = {}
        
        print("[DB] Inserting lessons...")
        for item in lessons_data:
            # Check if lesson Already exists by title or video_url to avoid duplicates
            existing = db.fetch_all("SELECT lesson_id FROM lessons WHERE video_url = %s", (item['video'],))
            if not existing:
                lesson_id = db.execute_query(
                    "INSERT INTO lessons (title, category_id, video_url, thumbnail, difficulty) VALUES (%s, %s, %s, %s, %s)",
                    (item['title'], current_categories.get(item['category']), item['video'], item['thumbnail'], item['difficulty'])
                )
                video_to_lesson_id[item['video']] = lesson_id
            else:
                video_to_lesson_id[item['video']] = existing[0]['lesson_id']

        # 4. Insert Quizzes
        print("[DB] Inserting quizzes...")
        for item in quizzes_data:
            # Find lesson_id by video match
            lesson_id = video_to_lesson_id.get(item['video'])
            
            # Check if quiz exists
            existing_quiz = db.fetch_all("SELECT quiz_id FROM quizzes WHERE question = %s AND video_url = %s", (item['question'], item['video']))
            
            if not existing_quiz:
                db.execute_query(
                    """INSERT INTO quizzes 
                       (lesson_id, question, option_1, option_2, option_3, option_4, correct_answer, video_url, thumbnail, category, difficulty) 
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    (
                        lesson_id, 
                        item['question'], 
                        item['options'][0], item['options'][1], item['options'][2], item['options'][3],
                        item['answer'],
                        item['video'],
                        item['thumbnail'],
                        item['category'],
                        item['difficulty']
                    )
                )

        print("[Done] Data import completed successfully.")

    except Exception as e:
        print(f"[Error] Import failed: {e}")

if __name__ == "__main__":
    import_data()
