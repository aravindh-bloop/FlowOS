import enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, func, JSON
from app.database import Base

class EventType(str, enum.Enum):
    PATIENT_ADMITTED = "PATIENT_ADMITTED"
    BED_ASSIGNED = "BED_ASSIGNED"
    PATIENT_MOVED = "PATIENT_MOVED"
    BED_RELEASED = "BED_RELEASED"
    PROCEDURE_STARTED = "PROCEDURE_STARTED"
    PROCEDURE_COMPLETED = "PROCEDURE_COMPLETED"
    DIAGNOSTIC_STARTED = "DIAGNOSTIC_STARTED"
    DIAGNOSTIC_COMPLETED = "DIAGNOSTIC_COMPLETED"
    STAFF_ASSIGNED = "STAFF_ASSIGNED"
    EQUIPMENT_UNAVAILABLE = "EQUIPMENT_UNAVAILABLE"
    EMERGENCY_DECLARED = "EMERGENCY_DECLARED"
    ALERT_CREATED = "ALERT_CREATED"
    ORCHESTRATION_ACTION_APPROVED = "ORCHESTRATION_ACTION_APPROVED"
    ORCHESTRATION_ACTION_EXECUTED = "ORCHESTRATION_ACTION_EXECUTED"

class HospitalEvent(Base):
    __tablename__ = "hospital_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(Enum(EventType), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=True)
    resource_type = Column(String(50), nullable=True)
    resource_id = Column(Integer, nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    timestamp = Column(DateTime, server_default=func.now())
    source = Column(String(100), default='SYSTEM')
    metadata_ = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
