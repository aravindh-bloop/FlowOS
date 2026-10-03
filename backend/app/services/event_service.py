from sqlalchemy.orm import Session
from app.models.event import HospitalEvent
from app.schemas.event import HospitalEventCreate

def create_event(db: Session, event_data: HospitalEventCreate):
    event = HospitalEvent(**event_data.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

def get_events(db: Session, event_type: str = None, department_id: int = None):
    query = db.query(HospitalEvent)
    if event_type:
        query = query.filter(HospitalEvent.event_type == event_type)
    if department_id:
        query = query.filter(HospitalEvent.department_id == department_id)
    return query.order_by(HospitalEvent.timestamp.desc()).all()
