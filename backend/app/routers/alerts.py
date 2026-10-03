from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas.alert import AlertResponse, NotificationResponse, AcknowledgeAlertRequest
from app.services.alert_service import get_alerts, acknowledge_alert, get_notifications
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

@router.get("", response_model=List[AlertResponse])
def read_alerts(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return get_alerts(db)

@router.post("/{id}/acknowledge", response_model=AlertResponse)
def ack_alert(id: int, request: Optional[AcknowledgeAlertRequest] = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    user_id = request.user_id if (request and request.user_id) else current_user.id
    alert = acknowledge_alert(db, id, user_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.get("/notifications", response_model=List[NotificationResponse])
def read_notifications(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return get_notifications(db)
