from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ...database.session import get_db
from ...models.user import User
from ...models.meal import Meal
from ...schemas.meal import MealCreate, MealResponse
from ...auth.dependencies import get_current_user

router = APIRouter()

@router.get("", response_model=List[MealResponse])
def get_user_meals(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    meals = db.query(Meal).filter(Meal.user_id == user.id).order_by(Meal.logged_at.desc()).all()
    return [
        MealResponse(
            id=m.id,
            tag=m.meal_type,
            name=m.title,
            kcal=m.total_calories,
            logged_at=m.logged_at
        )
        for m in meals
    ]

@router.post("", response_model=MealResponse)
def log_meal(
    data: MealCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    meal = Meal(
        user_id=user.id,
        meal_type=data.tag,
        title=data.name,
        total_calories=data.kcal,
        total_protein_g=data.protein_g,
        total_carbs_g=data.carbs_g,
        total_fat_g=data.fat_g,
        image_url=data.image_url,
        notes=data.notes
    )
    db.add(meal)
    db.commit()
    db.refresh(meal)
    
    return MealResponse(
        id=meal.id,
        tag=meal.meal_type,
        name=meal.title,
        kcal=meal.total_calories,
        logged_at=meal.logged_at
    )

@router.delete("/{meal_id}")
def delete_meal(
    meal_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    meal = db.query(Meal).filter(Meal.id == meal_id, Meal.user_id == user.id).first()
    if not meal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal not found"
        )
    db.delete(meal)
    db.commit()
    return {"message": "Meal deleted successfully"}
