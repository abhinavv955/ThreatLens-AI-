from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from datetime import datetime
from ..database.session import Base

class FoodItem(Base):
    __tablename__ = "food_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    serving_size = Column(String, default="1 serving")
    
    calories = Column(Integer, default=0)
    protein_g = Column(Float, default=0.0)
    carbs_g = Column(Float, default=0.0)
    fat_g = Column(Float, default=0.0)
    fiber_g = Column(Float, default=0.0)
    health_score = Column(Integer, default=90)
    
    micronutrients = Column(JSON, default=list)  # e.g. ["Vitamin C", "Iron", "Calcium"]
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
