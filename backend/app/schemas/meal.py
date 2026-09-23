from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class MealCreate(BaseModel):
    tag: str = "Lunch"  # Breakfast, Lunch, Dinner, Snack
    name: str
    kcal: int
    protein_g: Optional[float] = 0.0
    carbs_g: Optional[float] = 0.0
    fat_g: Optional[float] = 0.0
    image_url: Optional[str] = None
    notes: Optional[str] = None

class MealResponse(BaseModel):
    id: int
    tag: str
    name: str
    kcal: int
    logged_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class FoodScanResponse(BaseModel):
    id: str
    title: str
    description: str
    score: int
    kcal: int
    protein: str
    carbs: str
    fat: str
    tags: List[str]
    imageUrl: str
