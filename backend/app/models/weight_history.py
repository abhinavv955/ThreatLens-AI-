from sqlalchemy import Column, Integer, Float, DateTime, String, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database.session import Base

class WeightHistory(Base):
    __tablename__ = "weight_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    weight_kg = Column(Float, nullable=False)
    bmi = Column(Float, nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(String, nullable=True)

    # Relationship
    user = relationship("User", back_populates="weight_records")
