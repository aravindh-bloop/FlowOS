from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date, time
from app.models.staff import StaffRole, ShiftType, StaffStatus, AssignmentType, AssignmentStatus

class StaffResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    employee_id: str
    first_name: str
    last_name: str
    role: StaffRole
    specialization: Optional[str] = None
    department_id: int
    contact_phone: Optional[str] = None
    email: Optional[str] = None
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}

class StaffAvailabilityResponse(BaseModel):
    id: int
    staff_id: int
    date: date
    shift: ShiftType
    status: StaffStatus
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    notes: Optional[str] = None
    model_config = {"from_attributes": True}

class StaffAssignmentResponse(BaseModel):
    id: int
    staff_id: int
    assignment_type: AssignmentType
    patient_id: Optional[int] = None
    department_id: Optional[int] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    status: AssignmentStatus
    notes: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}
