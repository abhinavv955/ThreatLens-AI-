from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = "Maya"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    health_goal: Optional[str] = None
    dietary_preferences: Optional[str] = None
    allergies: Optional[str] = None
    calorie_target: Optional[int] = None

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    age: int
    height_cm: float
    weight_kg: float
    health_goal: str
    dietary_preferences: str
    allergies: str
    calorie_target: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

TokenResponse.model_rebuild()
