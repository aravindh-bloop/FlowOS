from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.analytics import AnalyticsResponse, DepartmentAnalytics
from app.services.analytics_service import get_analytics
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("", response_model=AnalyticsResponse)
def read_analytics(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return get_analytics(db)

@router.get("/department/{id}", response_model=DepartmentAnalytics)
def read_department_analytics(id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    analytics = get_analytics(db)
    for dept in analytics.get("departments", []):
        if dept.get("department_id") == id:
            return dept
    return None
