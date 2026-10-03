from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.resource import EquipmentType, EquipmentStatus, TheatreStatus, TheatreType

class EquipmentResponse(BaseModel):
    id: int
    name: str
    type: EquipmentType
    department_id: int
    status: EquipmentStatus
    location: Optional[str] = None
    model_name: Optional[str] = None
    serial_number: Optional[str] = None
    last_maintenance: Optional[datetime] = None
    next_maintenance: Optional[datetime] = None
    current_patient_id: Optional[int] = None
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True, "protected_namespaces": ()}

class OperatingTheatreResponse(BaseModel):
    id: int
    name: str
    theatre_number: str
    department_id: int
    status: TheatreStatus
    theatre_type: TheatreType
    current_procedure_id: Optional[int] = None
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}
