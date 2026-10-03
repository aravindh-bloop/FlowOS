from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from app.models.event import EventType

class HospitalEventCreate(BaseModel):
    event_type: EventType
    patient_id: Optional[int] = None
    staff_id: Optional[int] = None
    resource_type: Optional[str] = None
    resource_id: Optional[int] = None
    department_id: Optional[int] = None
    source: Optional[str] = 'SYSTEM'
    metadata_: Optional[Dict[str, Any]] = None

class HospitalEventResponse(HospitalEventCreate):
    id: int
    timestamp: datetime
    created_at: datetime
    model_config = {"from_attributes": True}
