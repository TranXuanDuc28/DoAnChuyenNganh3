from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from datetime import date, timedelta, datetime
from app.db.session import get_db
from app.schemas.streak import StreakDetails, DailyActivity, Milestone

router = APIRouter()

@router.get("/details", response_model=StreakDetails)
def get_streak_details(db: Session = Depends(get_db)):
    user_id = 1
    
    # 1. Basic Streak
    streak_val = db.execute(
        text("SELECT current_streak FROM streaks WHERE user_id = :u"),
        {"u": user_id}
    ).scalar() or 0
    
    # 2. Weekly Hours (Mocking: 1 lesson completion = 3 hours for display)
    completed_this_week = db.execute(
        text("SELECT COUNT(*) FROM user_progress WHERE user_id = :u AND updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"),
        {"u": user_id}
    ).scalar() or 0
    weekly_hours = float(completed_this_week * 3)
    weekly_goal_hours = 15.0
    
    # 3. Daily Activity
    daily_activity = []
    days_labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    today = date.today()
    start_of_week = today - timedelta(days=today.weekday())
    
    for i in range(7):
        current_day = start_of_week + timedelta(days=i)
        label = days_labels[i]
        
        has_activity = db.execute(
            text("SELECT COUNT(*) FROM user_progress WHERE user_id = :u AND DATE(updated_at) = :d"),
            {"u": user_id, "d": current_day}
        ).scalar() or 0
        
        is_today = (current_day == today)
        is_future = (current_day > today)
        
        if is_today:
            type_val = 'star'
            active = True
        elif is_future:
            type_val = 'num'
            active = False
        else:
            type_val = 'flame'
            active = (has_activity > 0)
            
        daily_activity.append(DailyActivity(
            label='Today' if is_today else label,
            type=type_val,
            active=active,
            value=current_day.day if type_val == 'num' else None
        ))
        
    # 4. Milestones
    milestones = [
        Milestone(
            title="15-Day Milestone",
            target_value=15,
            current_value=streak_val,
            unit="days",
            desc=f"{15 - streak_val} days left to earn the Silver Badge" if streak_val < 15 else "Completed!",
            progress_percent=int(min(100, (streak_val / 15) * 100))
        ),
        Milestone(
            title="30-Day Milestone",
            target_value=30,
            current_value=streak_val,
            unit="days",
            desc="Reward: Free Advanced Course",
            progress_percent=int(min(100, (streak_val / 30) * 100))
        )
    ]
    
    # 5. AI Insight (Find most active hour)
    active_hours = db.execute(
        text("SELECT HOUR(updated_at) as h, COUNT(*) as count FROM user_progress WHERE user_id = :u GROUP BY h ORDER BY count DESC LIMIT 1"),
        {"u": user_id}
    ).mappings().first()
    
    if active_hours:
        best_hour = active_hours['h']
        period = "AM" if best_hour < 12 else "PM"
        display_hour = best_hour if best_hour <= 12 else best_hour - 12
        if display_hour == 0: display_hour = 12
        insight = f"You study most effectively around {display_hour}:00 {period}. Maintain this schedule to optimize your sign language retention!"
    else:
        insight = "Start learning to get personalized AI insights about your study habits!"
        
    return {
        "current_streak": streak_val,
        "weekly_hours": weekly_hours,
        "weekly_goal_hours": weekly_goal_hours,
        "daily_activity": daily_activity,
        "milestones": milestones,
        "ai_insight": insight
    }
