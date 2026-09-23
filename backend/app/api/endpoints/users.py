from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...database.session import get_db
from ...models.user import User
from ...schemas.user import UserResponse, UserUpdate
from ...auth.dependencies import get_current_user

router = APIRouter()

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(user: User = Depends(get_current_user)):
    return user

@router.put("/me", response_model=UserResponse)
def update_profile(
    updates: UserUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    update_data = updates.dict(exclude_unset=True)
    for field, val in update_data.items():
        if val is not None:
            setattr(user, field, val)
            
    db.commit()
    db.refresh(user)
    return user
