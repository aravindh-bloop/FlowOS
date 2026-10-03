from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime
from app.models.patient import Gender, AdmissionStatus, AdmissionType, PriorityLevel, TransferStatus

class PatientBase(BaseModel):
    mrn: str
    first_name: str
    last_name: str
    date_of_birth: date
    gender: Gender
    blood_type: Optional[str] = None
    contact_phone: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    address: Optional[str] = None
    insurance_id: Optional[str] = None

class PatientResponse(PatientBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = {"from_attributes": True}

class AdmissionResponse(BaseModel):
    id: int
    patient_id: int
    department_id: int
    department_name: Optional[str] = None
    bed_id: Optional[int] = None
    bed_number: Optional[str] = None
    attending_doctor_id: Optional[int] = None
    attending_doctor_name: Optional[str] = None
    admission_date: datetime
    discharge_date: Optional[datetime] = None
    status: AdmissionStatus
    admission_type: AdmissionType
    priority: PriorityLevel
    diagnosis: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}

from app.schemas.event import HospitalEventResponse

class PatientDetail(PatientResponse):
    admissions: List[AdmissionResponse] = []
    events: List[HospitalEventResponse] = []
    current_admission: Optional[AdmissionResponse] = None
    model_config = {"from_attributes": True}

class PatientTransferResponse(BaseModel):
    id: int
    admission_id: int
    patient_id: int
    from_department_id: Optional[int] = None
    to_department_id: Optional[int] = None
    from_bed_id: Optional[int] = None
    to_bed_id: Optional[int] = None
    transfer_time: datetime
    reason: Optional[str] = None
    status: TransferStatus
    initiated_by: Optional[int] = None
    created_at: datetime
    model_config = {"from_attributes": True}
