import enum
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum, func
from sqlalchemy.orm import relationship
from app.database import Base

class ProcedureType(str, enum.Enum):
    SURGERY = "SURGERY"
    DIAGNOSTIC = "DIAGNOSTIC"
    THERAPEUTIC = "THERAPEUTIC"
    EMERGENCY = "EMERGENCY"

class ProcedureStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    PREPARING = "PREPARING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    DELAYED = "DELAYED"

class ProcedurePriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    EMERGENCY = "EMERGENCY"

class AppointmentStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    CHECKED_IN = "CHECKED_IN"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"

class AppointmentType(str, enum.Enum):
    CONSULTATION = "CONSULTATION"
    FOLLOW_UP = "FOLLOW_UP"
    DIAGNOSTIC = "DIAGNOSTIC"
    PROCEDURE = "PROCEDURE"
    EMERGENCY = "EMERGENCY"

class ResourceTypeEnum(str, enum.Enum):
    BED = "BED"
    DOCTOR = "DOCTOR"
    EQUIPMENT = "EQUIPMENT"
    OT = "OT"
    DIAGNOSTIC = "DIAGNOSTIC"

class QueueStatus(str, enum.Enum):
    WAITING = "WAITING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class Procedure(Base):
    __tablename__ = "procedures"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    name = Column(String(255), nullable=False)
    procedure_type = Column(Enum(ProcedureType), nullable=False)
    scheduled_start = Column(DateTime, nullable=True)
    scheduled_end = Column(DateTime, nullable=True)
    actual_start = Column(DateTime, nullable=True)
    actual_end = Column(DateTime, nullable=True)
    status = Column(Enum(ProcedureStatus), nullable=False)
    theatre_id = Column(Integer, ForeignKey("operating_theatres.id"), nullable=True)
    surgeon_id = Column(Integer, ForeignKey("staff.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    priority = Column(Enum(ProcedurePriority), default=ProcedurePriority.MEDIUM)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("staff.id"), nullable=True)
    scheduled_time = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=30)
    status = Column(Enum(AppointmentStatus), nullable=False)
    appointment_type = Column(Enum(AppointmentType), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class Queue(Base):
    __tablename__ = "queues"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    resource_type = Column(Enum(ResourceTypeEnum), nullable=False)
    resource_id = Column(Integer, nullable=True)
    priority = Column(Enum(ProcedurePriority), default=ProcedurePriority.MEDIUM)
    position = Column(Integer, nullable=False)
    status = Column(Enum(QueueStatus), default=QueueStatus.WAITING)
    estimated_wait_minutes = Column(Integer, nullable=True)
    actual_wait_minutes = Column(Integer, nullable=True)
    joined_at = Column(DateTime, nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
