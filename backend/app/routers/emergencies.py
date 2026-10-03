from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas.alert import AlertResponse
from app.services.emergency_service import declare_emergency, get_emergencies, respond_emergency
from app.dependencies import get_current_user
from pydantic import BaseModel, Field
from app.models.alert import Alert

class EmergencyCreate(BaseModel):
    type: Optional[str] = "MASS_CASUALTY"
    severity: Optional[str] = "CRITICAL"
    description: Optional[str] = "Emergency situation declared"
    title: Optional[str] = None
    departmentId: Optional[str] = None

class EmergencyRespond(BaseModel):
    user_id: Optional[int] = None

router = APIRouter(prefix="/api/emergencies", tags=["emergencies"])

@router.post("", response_model=AlertResponse)
def create_emergency(req: Optional[EmergencyCreate] = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    type_ = req.type if req and req.type else "MASS_CASUALTY"
    severity = req.severity if req and req.severity else "CRITICAL"
    description = req.description if req and req.description else "Emergency situation declared"
    title = req.title if req else None
    return declare_emergency(db, type_=type_, severity=severity, description=description, title=title)

@router.get("", response_model=List[AlertResponse])
def read_emergencies(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return get_emergencies(db)

@router.get("/{id}", response_model=AlertResponse)
def read_emergency(id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Emergency not found")
    return alert

@router.post("/{id}/respond", response_model=AlertResponse)
def respond_to_emergency(id: int, req: Optional[EmergencyRespond] = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    uid = req.user_id if req and req.user_id else current_user.id
    return respond_emergency(db, id, uid)
