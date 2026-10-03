import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum, func, JSON
from app.database import Base

class AlertType(str, enum.Enum):
    ICU_CAPACITY = "ICU_CAPACITY"
    BED_SHORTAGE = "BED_SHORTAGE"
    STAFF_OVERLOAD = "STAFF_OVERLOAD"
    EQUIPMENT_FAILURE = "EQUIPMENT_FAILURE"
    EMERGENCY = "EMERGENCY"
    QUEUE_DELAY = "QUEUE_DELAY"
    OT_PRESSURE = "OT_PRESSURE"
    PATIENT_CRITICAL = "PATIENT_CRITICAL"
    DIAGNOSTIC_DELAY = "DIAGNOSTIC_DELAY"
    RESOURCE_UNAVAILABLE = "RESOURCE_UNAVAILABLE"

class AlertSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class NotificationType(str, enum.Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"
    ACTION_REQUIRED = "ACTION_REQUIRED"

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(Enum(AlertType), nullable=False)
    severity = Column(Enum(AlertSeverity), nullable=False)
    title = Column(String(500), nullable=False)
    message = Column(Text, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    resource_type = Column(String(50), nullable=True)
    resource_id = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    auto_generated = Column(Boolean, default=False)
    metadata_ = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=True)
    title = Column(String(500), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(Enum(NotificationType), nullable=False)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
