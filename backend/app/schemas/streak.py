from pydantic import BaseModel
from typing import List, Optional

class DailyActivity(BaseModel):
    label: str
    type: str # 'flame', 'star', 'num'
    active: bool
    value: Optional[int] = None

class Milestone(BaseModel):
    title: str
    target_value: int
    current_value: int
    unit: str # 'hours', '%'
    desc: str
    progress_percent: int

class StreakDetails(BaseModel):
    current_streak: int
    weekly_hours: float
    weekly_goal_hours: float
    daily_activity: List[DailyActivity]
    milestones: List[Milestone]
    ai_insight: str
