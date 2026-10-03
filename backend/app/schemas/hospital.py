from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.models.hospital import DepartmentType, RoomType, BedType, BedStatus

class DepartmentResponse(BaseModel):
    id: int
    name: str
    code: str
    type: DepartmentType
    floor: Optional[int] = None
    description: Optional[str] = None
    head_doctor_id: Optional[int] = None
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}

class WardResponse(BaseModel):
    id: int
    name: str
    department_id: int
    floor: Optional[int] = None
    capacity: int
    current_occupancy: int
    is_active: bool
    model_config = {"from_attributes": True}

class RoomResponse(BaseModel):
    id: int
    room_number: str
    ward_id: int
    room_type: RoomType
    floor: Optional[int] = None
    capacity: int
    model_config = {"from_attributes": True}

class BedResponse(BaseModel):
    id: int
    bed_number: str
    room_id: int
    ward_id: int
    department_id: int
    bed_type: BedType
    status: BedStatus
    patient_id: Optional[int] = None
    is_active: bool
    updated_at: Optional[datetime] = None
    model_config = {"from_attributes": True}

class BedSummary(BaseModel):
    total_beds: int
    available_beds: int
    occupied_beds: int
    reserved_beds: int
    maintenance_beds: int
    utilization_rate: float
    model_config = {"from_attributes": True}
