from fastapi import APIRouter
from .endpoints import auth, users, meals, food, dashboard, recommendations, chat, weight

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(meals.router, prefix="/meals", tags=["meals"])
api_router.include_router(food.router, prefix="/food", tags=["food"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(weight.router, prefix="/weight", tags=["weight"])
