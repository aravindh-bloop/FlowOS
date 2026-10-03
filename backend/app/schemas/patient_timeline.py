from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

class CareRole(str, Enum):
    DOCTOR = "DOCTOR"
    NURSE = "NURSE"
    CARETAKER = "CARETAKER"
    ADMISSION = "ADMISSION"

class UnifiedTimelineItem(BaseModel):
    id: str
    patient_id: int
    role: str
    actor: str
    actor_title: Optional[str] = None
    title: str
    body: str
    timestamp: datetime
    tone: Optional[str] = "teal"
    category: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class PostTimelineUpdateRequest(BaseModel):
    role: str = Field(..., description="DOCTOR, NURSE, or CARETAKER")
    title: str
    body: str
    actor: Optional[str] = None
    actor_title: Optional[str] = None
    category: Optional[str] = None
    tone: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class UnifiedTimelineResponse(BaseModel):
    patient_id: int
    patient_name: str
    mrn: str
    room_or_bed: Optional[str] = None
    events: List[UnifiedTimelineItem]
