import enum
from sqlalchemy import Column, Integer, String, DateTime, Text, Date, ForeignKey, Enum, func
from sqlalchemy.orm import relationship
from app.database import Base

class Gender(str, enum.Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"

class AdmissionStatus(str, enum.Enum):
    ADMITTED = "ADMITTED"
    IN_TREATMENT = "IN_TREATMENT"
    AWAITING_TRANSFER = "AWAITING_TRANSFER"
    AWAITING_DISCHARGE = "AWAITING_DISCHARGE"
    DISCHARGED = "DISCHARGED"
    TRANSFERRED = "TRANSFERRED"

class AdmissionType(str, enum.Enum):
    EMERGENCY = "EMERGENCY"
    PLANNED = "PLANNED"
    TRANSFER = "TRANSFER"
    WALK_IN = "WALK_IN"

class PriorityLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class TransferStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    mrn = Column(String(50), unique=True, index=True, nullable=False)
    first_name = Column(String(255), nullable=False)
    last_name = Column(String(255), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(Enum(Gender), nullable=False)
    blood_type = Column(String(10), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    emergency_contact_name = Column(String(255), nullable=True)
    emergency_contact_phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    insurance_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    admissions = relationship("Admission", back_populates="patient")

class Admission(Base):
    __tablename__ = "admissions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    bed_id = Column(Integer, ForeignKey("beds.id"), nullable=True)
    attending_doctor_id = Column(Integer, ForeignKey("staff.id"), nullable=True)
    admission_date = Column(DateTime, nullable=False)
    discharge_date = Column(DateTime, nullable=True)
    status = Column(Enum(AdmissionStatus), nullable=False)
    admission_type = Column(Enum(AdmissionType), nullable=False)
    priority = Column(Enum(PriorityLevel), default=PriorityLevel.MEDIUM)
    diagnosis = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    patient = relationship("Patient", back_populates="admissions")
    department = relationship("Department")
    bed = relationship("Bed")
    attending_doctor = relationship("Staff")

class PatientTransfer(Base):
    __tablename__ = "patient_transfers"

    id = Column(Integer, primary_key=True, index=True)
    admission_id = Column(Integer, ForeignKey("admissions.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    from_department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    to_department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    from_bed_id = Column(Integer, ForeignKey("beds.id"), nullable=True)
    to_bed_id = Column(Integer, ForeignKey("beds.id"), nullable=True)
    transfer_time = Column(DateTime, nullable=False)
    reason = Column(Text, nullable=True)
    status = Column(Enum(TransferStatus), nullable=False)
    initiated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
