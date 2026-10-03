import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, func
from sqlalchemy.orm import relationship
from app.database import Base

class EquipmentType(str, enum.Enum):
    CT_SCANNER = "CT_SCANNER"
    MRI = "MRI"
    XRAY = "XRAY"
    ULTRASOUND = "ULTRASOUND"
    VENTILATOR = "VENTILATOR"
    CARDIAC_MONITOR = "CARDIAC_MONITOR"
    DEFIBRILLATOR = "DEFIBRILLATOR"
    INFUSION_PUMP = "INFUSION_PUMP"
    ECG = "ECG"

class EquipmentStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    IN_USE = "IN_USE"
    MAINTENANCE = "MAINTENANCE"
    UNAVAILABLE = "UNAVAILABLE"
    RESERVED = "RESERVED"

class TheatreStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    IN_USE = "IN_USE"
    CLEANING = "CLEANING"
    MAINTENANCE = "MAINTENANCE"
    RESERVED = "RESERVED"

class TheatreType(str, enum.Enum):
    GENERAL = "GENERAL"
    CARDIAC = "CARDIAC"
    NEURO = "NEURO"
    ORTHOPEDIC = "ORTHOPEDIC"
    EMERGENCY = "EMERGENCY"
    MINOR = "MINOR"

class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(Enum(EquipmentType), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    status = Column(Enum(EquipmentStatus), default=EquipmentStatus.AVAILABLE)
    location = Column(String(255), nullable=True)
    model_name = Column(String(255), nullable=True)
    serial_number = Column(String(255), nullable=True)
    last_maintenance = Column(DateTime, nullable=True)
    next_maintenance = Column(DateTime, nullable=True)
    current_patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    department = relationship("Department")

class OperatingTheatre(Base):
    __tablename__ = "operating_theatres"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    theatre_number = Column(String(50), unique=True, index=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    status = Column(Enum(TheatreStatus), default=TheatreStatus.AVAILABLE)
    theatre_type = Column(Enum(TheatreType), nullable=False)
    current_procedure_id = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    department = relationship("Department")
