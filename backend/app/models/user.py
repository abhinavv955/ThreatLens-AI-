from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False, default="Maya")
    age = Column(Integer, default=28)
    height_cm = Column(Float, default=170.0)
    weight_kg = Column(Float, default=66.9)
    health_goal = Column(String, default="Feel stronger")
    dietary_preferences = Column(String, default="Vegetarian · no peanuts")
    allergies = Column(String, default="Peanuts")
    calorie_target = Column(Integer, default=2100)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    meals = relationship("Meal", back_populates="user", cascade="all, delete-orphan")
    weight_records = relationship("WeightHistory", back_populates="user", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
