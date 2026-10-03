from sqlalchemy.orm import Session
from app.models.alert import Alert, AlertType, AlertSeverity
from app.models.event import HospitalEvent, EventType
from datetime import datetime, timezone
from typing import Optional

def declare_emergency(db: Session, type_: str, severity: str, description: str, title: Optional[str] = None, department_id: Optional[int] = None):
    emergency_title = title or f"EMERGENCY DECLARED: {type_.replace('_', ' ')}"
    
    # Store AI response plan in metadata_ JSON field
    ai_plan = [
        "1. Activate Mass Casualty / Triage Protocol in Trauma Bay 1 & 2.",
        "2. Clear 4 ICU beds immediately by transferring stable patients to Ward B.",
        "3. Cancel all elective surgeries for the next 6 hours; prepare 2 Operating Theatres.",
        "4. Notify off-duty trauma surgeons and senior emergency nurses via SMS broadcast.",
        "5. Reserve CT Scanner #1 exclusively for incoming emergency trauma scans."
    ]
    
    alert = Alert(
        alert_type=AlertType.EMERGENCY,
        severity=AlertSeverity.CRITICAL if severity == 'CRITICAL' else AlertSeverity.HIGH,
        title=emergency_title,
        message=description,
        department_id=department_id,
        auto_generated=False,
        metadata_={"type": type_, "aiResponsePlan": ai_plan, "status": "ACTIVE"}
    )
    db.add(alert)
    db.commit()

    # Log event
    event = HospitalEvent(
        event_type=EventType.EMERGENCY_DECLARED,
        source="COMMAND_CENTER",
        metadata_={"title": emergency_title, "type": type_, "severity": severity}
    )
    db.add(event)
    db.commit()

    db.refresh(alert)
    return alert

def get_emergencies(db: Session):
    return db.query(Alert).filter(Alert.alert_type == AlertType.EMERGENCY).order_by(Alert.created_at.desc()).all()

def respond_emergency(db: Session, emergency_id: int, user_id: int):
    alert = db.query(Alert).filter(Alert.id == emergency_id).first()
    if alert:
        alert.is_acknowledged = True
        alert.acknowledged_by = user_id
        alert.acknowledged_at = datetime.now(timezone.utc)
        meta = alert.metadata_ or {}
        meta["status"] = "RESPONDING"
        alert.metadata_ = meta
        db.commit()
        db.refresh(alert)
    return alert
