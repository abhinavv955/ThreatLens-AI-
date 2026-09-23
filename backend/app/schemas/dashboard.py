from pydantic import BaseModel
from typing import List, Optional

class DashboardResponse(BaseModel):
    dailyCaloriesEaten: int
    dailyCalorieTarget: int
    calorieTrendText: str
    goalProgressPercent: int
    streakDays: int
    currentWeightKg: float
    weightTrendText: str
    bmi: float
    proteinEatenG: int
    proteinTargetG: int
    carbsEatenG: int
    carbsTargetG: int
    fatEatenG: int
    fatTargetG: int
    waterCups: int
    waterTargetCups: int

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str
    contextUsed: Optional[dict] = None
