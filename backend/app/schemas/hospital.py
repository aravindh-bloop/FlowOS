from pydantic import BaseModel
from typing import List, Optional, Union
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
    patient_name: Optional[str] = None
    patient_mrn: Optional[str] = None
    department_name: Optional[str] = None
    room_number: Optional[str] = None
    admission_id: Optional[int] = None
    is_active: bool
    updated_at: Optional[datetime] = None
    model_config = {"from_attributes": True}

class AssignBedRequest(BaseModel):
    patient_id: int
    admission_id: Optional[int] = None
    notes: Optional[str] = None

class TransferBedRequest(BaseModel):
    to_bed_id: int
    reason: Optional[str] = None

class BedSummary(BaseModel):
    total_beds: int
    available_beds: int
    occupied_beds: int
    reserved_beds: int
    maintenance_beds: int
    utilization_rate: float
    model_config = {"from_attributes": True}

class RfidBedScanRequest(BaseModel):
    user_id: Optional[Union[int, str]] = None
    bed_id: Union[int, str]
    action: Optional[str] = None  # "assign", "release", "toggle", "checkin", "checkout"
    status: Optional[str] = None  # "OCCUPIED", "AVAILABLE", etc.
    reader_id: Optional[str] = None
    notes: Optional[str] = None

class RfidBedScanResponse(BaseModel):
    success: bool = True
    message: str
    action: str  # "ASSIGNED", "RELEASED", "UPDATED"
    bed: BedResponse
    patient: Optional[dict] = None
