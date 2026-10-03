from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from app.models.patient import Gender, PriorityLevel

class PatientIntakeRequest(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    date_of_birth: date
    gender: Gender
    contact_phone: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    address: Optional[str] = None
    insurance_id: Optional[str] = None
    
    # Clinical triage & discomfort parameters
    discomfort_type: str = Field(..., description="Primary complaint or discomfort category, e.g., 'Chest pain', 'Fracture', 'Fever'")
    symptoms_description: Optional[str] = None
    priority: Optional[PriorityLevel] = PriorityLevel.MEDIUM
    
    # Scheduling preferences
    preferred_department_id: Optional[int] = None
    preferred_doctor_id: Optional[int] = None
    consultation_time: Optional[str] = None  # e.g., "10:30 AM" or ISO string

class DoctorMatchInfo(BaseModel):
    id: int
    name: str
    role: str
    specialization: Optional[str]
    department_id: int
    department_name: str
    room_number: str
    shift_status: str
    active_queue_count: int

class ConsultationDetails(BaseModel):
    token_number: str
    queue_position: int
    estimated_wait_minutes: int
    estimated_start_time: str
    room_location: str
    priority: PriorityLevel
    status: str

class PatientIntakeResponse(BaseModel):
    success: bool
    message: str
    patient_id: int
    mrn: str
    patient_name: str
    assigned_doctor: DoctorMatchInfo
    consultation: ConsultationDetails
    mapping_reason: str
    created_at: datetime
