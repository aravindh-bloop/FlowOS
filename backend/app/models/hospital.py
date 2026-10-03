import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, func, Enum
from sqlalchemy.orm import relationship
from app.database import Base

class DepartmentType(str, enum.Enum):
    EMERGENCY = "EMERGENCY"
    ICU = "ICU"
    GENERAL_MEDICINE = "GENERAL_MEDICINE"
    SURGERY = "SURGERY"
    ORTHOPEDICS = "ORTHOPEDICS"
    CARDIOLOGY = "CARDIOLOGY"
    NEUROLOGY = "NEUROLOGY"
    PEDIATRICS = "PEDIATRICS"
    OBSTETRICS = "OBSTETRICS"
    ONCOLOGY = "ONCOLOGY"
    RADIOLOGY = "RADIOLOGY"
    PATHOLOGY = "PATHOLOGY"

class RoomType(str, enum.Enum):
    GENERAL = "GENERAL"
    PRIVATE = "PRIVATE"
    SEMI_PRIVATE = "SEMI_PRIVATE"
    ICU = "ICU"
    ISOLATION = "ISOLATION"
    EMERGENCY = "EMERGENCY"

class BedType(str, enum.Enum):
    REGULAR = "REGULAR"
    ICU = "ICU"
    EMERGENCY = "EMERGENCY"
    RECOVERY = "RECOVERY"
    PEDIATRIC = "PEDIATRIC"
    MATERNITY = "MATERNITY"

class BedStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    OCCUPIED = "OCCUPIED"
    RESERVED = "RESERVED"
    MAINTENANCE = "MAINTENANCE"
    UNAVAILABLE = "UNAVAILABLE"

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    type = Column(Enum(DepartmentType), nullable=False)
    floor = Column(Integer)
    description = Column(Text, nullable=True)
    head_doctor_id = Column(Integer, ForeignKey("staff.id", use_alter=True, name="fk_department_head_doctor"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    wards = relationship("Ward", back_populates="department")
    beds = relationship("Bed", back_populates="department")

class Ward(Base):
    __tablename__ = "wards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    floor = Column(Integer)
    capacity = Column(Integer, nullable=False)
    current_occupancy = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    department = relationship("Department", back_populates="wards")
    rooms = relationship("Room", back_populates="ward")
    beds = relationship("Bed", back_populates="ward")

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String(50), nullable=False)
    ward_id = Column(Integer, ForeignKey("wards.id"), nullable=False)
    room_type = Column(Enum(RoomType), nullable=False)
    floor = Column(Integer)
    capacity = Column(Integer, default=1)

    ward = relationship("Ward", back_populates="rooms")
    beds = relationship("Bed", back_populates="room")

class Bed(Base):
    __tablename__ = "beds"

    id = Column(Integer, primary_key=True, index=True)
    bed_number = Column(String(50), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    ward_id = Column(Integer, ForeignKey("wards.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    bed_type = Column(Enum(BedType), nullable=False)
    status = Column(Enum(BedStatus), default=BedStatus.AVAILABLE)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime, onupdate=func.now())

    room = relationship("Room", back_populates="beds")
    ward = relationship("Ward", back_populates="beds")
    department = relationship("Department", back_populates="beds")
