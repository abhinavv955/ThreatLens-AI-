from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from ...models.user import User
from ...services.recommendation_service import recommendation_service
from ...auth.dependencies import get_current_user

router = APIRouter()

@router.get("", response_model=List[Dict[str, Any]])
def get_recommendations(user: User = Depends(get_current_user)):
    return recommendation_service.get_recommendations_for_user(user)
