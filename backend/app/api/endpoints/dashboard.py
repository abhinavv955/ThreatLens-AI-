from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...database.session import get_db
from ...models.user import User
from ...schemas.dashboard import DashboardResponse
from ...services.dashboard_service import dashboard_service
from ...auth.dependencies import get_current_user

router = APIRouter()

@router.get("", response_model=DashboardResponse)
def get_dashboard(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    metrics = dashboard_service.get_dashboard_metrics(user, db)
    return DashboardResponse(**metrics)
