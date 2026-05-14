from pydantic import BaseModel
from typing import List, Optional

class ActivityDay(BaseModel):
    label: str
    minutes: int
    active: bool
    h: int # height for the chart

class CourseProgress(BaseModel):
    id: str
    title: str
    percent: int
    badge: str
    badgeBg: str
    badgeColor: str
    icon: str
    iconBg: str

class ProgressDashboard(BaseModel):
    overall_percent: int
    completed_lessons: int
    total_lessons_goal: int
    current_streak: int
    total_xp: int
    activity: List[ActivityDay]
    courses: List[CourseProgress]
