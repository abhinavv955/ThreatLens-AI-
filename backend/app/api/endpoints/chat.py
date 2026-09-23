from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...database.session import get_db
from ...models.user import User
from ...models.chat import ChatMessage
from ...models.meal import Meal
from ...schemas.chat import ChatRequest, ChatResponse
from ...ai.ai_assistant import ai_assistant_service
from ...auth.dependencies import get_current_user

router = APIRouter()

@router.post("", response_model=ChatResponse)
def chat_with_coach(
    data: ChatRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Retrieve today's meals for context
    meals = db.query(Meal).filter(Meal.user_id == user.id).all()
    total_cal = sum(m.total_calories for m in meals) if meals else 1552
    
    context = {
        "user_name": user.name,
        "goal": user.health_goal,
        "preferences": user.dietary_preferences,
        "allergies": user.allergies,
        "calorie_target": user.calorie_target,
        "calories_eaten": total_cal,
        "meal_count": len(meals),
    }

    # Save user message to database
    user_msg_record = ChatMessage(user_id=user.id, sender="user", text=data.message)
    db.add(user_msg_record)

    # Generate reply
    reply = ai_assistant_service.get_coach_response(data.message, context)

    # Save bot message to database
    bot_msg_record = ChatMessage(user_id=user.id, sender="bot", text=reply)
    db.add(bot_msg_record)
    db.commit()

    return ChatResponse(reply=reply, contextUsed=context)
