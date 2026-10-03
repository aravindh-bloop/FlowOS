import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Time, Text, ForeignKey, Enum, func
from sqlalchemy.orm import relationship
from app.database import Base

class StaffRole(str, enum.Enum):
    DOCTOR = "DOCTOR"
    NURSE = "NURSE"
    SURGEON = "SURGEON"
    TECHNICIAN = "TECHNICIAN"
    SPECIALIST = "SPECIALIST"
    RESIDENT = "RESIDENT"

class ShiftType(str, enum.Enum):
    MORNING = "MORNING"
    AFTERNOON = "AFTERNOON"
    NIGHT = "NIGHT"

class StaffStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    ON_DUTY = "ON_DUTY"
    OFF_DUTY = "OFF_DUTY"
    ON_LEAVE = "ON_LEAVE"
    ON_BREAK = "ON_BREAK"

class AssignmentType(str, enum.Enum):
    PATIENT_CARE = "PATIENT_CARE"
    PROCEDURE = "PROCEDURE"
    WARD_DUTY = "WARD_DUTY"
    EMERGENCY = "EMERGENCY"
    CONSULTATION = "CONSULTATION"

class AssignmentStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    employee_id = Column(String(50), unique=True, index=True, nullable=False)
    first_name = Column(String(255), nullable=False)
    last_name = Column(String(255), nullable=False)
    role = Column(Enum(StaffRole), nullable=False)
    specialization = Column(String(255), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    contact_phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    department = relationship("Department", foreign_keys=[department_id])
    availability = relationship("StaffAvailability", back_populates="staff")
    assignments = relationship("StaffAssignment", back_populates="staff")

class StaffAvailability(Base):
    __tablename__ = "staff_availability"

    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    date = Column(Date, nullable=False)
    shift = Column(Enum(ShiftType), nullable=False)
    status = Column(Enum(StaffStatus), nullable=False)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    notes = Column(Text, nullable=True)

    staff = relationship("Staff", back_populates="availability")

class StaffAssignment(Base):
    __tablename__ = "staff_assignments"

    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    assignment_type = Column(Enum(AssignmentType), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.ACTIVE)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    staff = relationship("Staff", back_populates="assignments")
