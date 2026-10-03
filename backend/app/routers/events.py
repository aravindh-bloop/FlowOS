from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.event import HospitalEventResponse, HospitalEventCreate
from app.services.event_service import get_events, create_event
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/events", tags=["events"])

@router.get("", response_model=List[HospitalEventResponse])
def read_events(event_type: str = None, department_id: int = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return get_events(db, event_type, department_id)

@router.post("", response_model=HospitalEventResponse)
def add_event(event_data: HospitalEventCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return create_event(db, event_data)
