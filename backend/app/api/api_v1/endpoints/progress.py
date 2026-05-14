from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from datetime import date, timedelta
from app.db.session import get_db
from app.schemas.progress import ProgressDashboard, ActivityDay, CourseProgress

router = APIRouter()

@router.get("/dashboard", response_model=ProgressDashboard)
def get_dashboard_data(db: Session = Depends(get_db)):
    user_id = 1 # Mock user_id 1
    
    # 1. Overall Progress
    total_lessons = db.execute(text("SELECT COUNT(*) FROM lessons")).scalar() or 1
    completed_lessons = db.execute(
        text("SELECT COUNT(*) FROM user_progress WHERE user_id = :u AND completed = 1"),
        {"u": user_id}
    ).scalar() or 0
    overall_percent = int((completed_lessons / total_lessons) * 100)
    
    # 2. Streak & XP
    streak = db.execute(
        text("SELECT current_streak FROM streaks WHERE user_id = :u"),
        {"u": user_id}
    ).scalar() or 0
    
    xp_progress = db.execute(
        text("SELECT SUM(score) FROM user_progress WHERE user_id = :u"),
        {"u": user_id}
    ).scalar() or 0
    xp_results = db.execute(
        text("SELECT SUM(score) FROM learning_results WHERE user_id = :u"),
        {"u": user_id}
    ).scalar() or 0
    total_xp = int(xp_progress + xp_results)
    
    # 3. Activity (Last 7 days)
    activity = []
    days_map = {0: 'Mon', 1: 'Tue', 2: 'Wed', 3: 'Thu', 4: 'Fri', 5: 'Sat', 6: 'Sun'}
    today = date.today()
    
    for i in range(6, -1, -1):
        target_date = today - timedelta(days=i)
        day_label = days_map[target_date.weekday()]
        
        # Mocking activity minutes based on user_progress updates for that day
        # In a real app, you'd have an activity_logs table
        count = db.execute(
            text("SELECT COUNT(*) FROM user_progress WHERE user_id = :u AND DATE(updated_at) = :d"),
            {"u": user_id, "d": target_date}
        ).scalar() or 0
        
        minutes = count * 15 # Mock: each lesson/activity = 15 mins
        is_today = (i == 0)
        
        activity.append(ActivityDay(
            label=day_label,
            minutes=minutes,
            active=is_today,
            h=min(144, minutes * 2 + 20) # Height for chart
        ))
        
    # 4. Courses Progress
    courses = []
    category_results = db.execute(text("""
        SELECT c.category_id, c.category_name, 
               COUNT(l.lesson_id) as total_lessons,
               SUM(CASE WHEN up.completed = 1 THEN 1 ELSE 0 END) as completed_lessons
        FROM categories c
        JOIN lessons l ON c.category_id = l.category_id
        LEFT JOIN user_progress up ON l.lesson_id = up.lesson_id AND up.user_id = :u
        GROUP BY c.category_id
        LIMIT 3
    """), {"u": user_id}).mappings().all()
    
    badges = [
        {"badge": "ADVANCED", "bg": "#E7DEFF", "color": "#4A3D7C", "icon": "alpha-a-box-outline", "iconBg": "#E5DEFF"},
        {"badge": "INTERMEDIATE", "bg": "#E5DEFF", "color": "#451CC8", "icon": "numeric", "iconBg": "#E4E1EF"},
        {"badge": "BEGINNER", "bg": "#EBE6F3", "color": "#484555", "icon": "forum-outline", "iconBg": "#E5E0EE"},
    ]
    
    for i, row in enumerate(category_results):
        percent = int((row['completed_lessons'] / row['total_lessons']) * 100) if row['total_lessons'] > 0 else 0
        badge_info = badges[i % len(badges)]
        
        courses.append(CourseProgress(
            id=str(row['category_id']),
            title=row['category_name'],
            percent=percent,
            badge=badge_info["badge"],
            badgeBg=badge_info["bg"],
            badgeColor=badge_info["color"],
            icon=badge_info["icon"],
            iconBg=badge_info["iconBg"]
        ))
        
    return {
        "overall_percent": overall_percent,
        "completed_lessons": completed_lessons,
        "total_lessons_goal": 5, # Mock goal
        "current_streak": streak,
        "total_xp": total_xp,
        "activity": activity,
        "courses": courses
    }
