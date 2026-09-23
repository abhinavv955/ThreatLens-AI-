from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from ...database.session import get_db
from ...models.user import User
from ...models.weight_history import WeightHistory
from ...services.nutrition_service import nutrition_service
from ...auth.dependencies import get_current_user

router = APIRouter()

class WeightRecordCreate(BaseModel):
    weight_kg: float
    notes: Optional[str] = None

class WeightRecordResponse(BaseModel):
    id: int
    weight_kg: float
    bmi: Optional[float] = None
    recorded_at: datetime
    notes: Optional[str] = None

    class Config:
        from_attributes = True

@router.get("/history", response_model=List[WeightRecordResponse])
def get_weight_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = db.query(WeightHistory).filter(WeightHistory.user_id == user.id).order_by(WeightHistory.recorded_at.desc()).all()
    return records

@router.post("", response_model=WeightRecordResponse)
def record_weight(
    data: WeightRecordCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bmi = nutrition_service.calculate_bmi(data.weight_kg, user.height_cm)
    
    # Update current user weight
    user.weight_kg = data.weight_kg
    
    record = WeightHistory(
        user_id=user.id,
        weight_kg=data.weight_kg,
        bmi=bmi,
        notes=data.notes
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
