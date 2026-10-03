from pydantic import BaseModel
from typing import List, Optional
from app.schemas.alert import AlertResponse

class BedOccupancy(BaseModel):
    total: int
    occupied: int
    available: int
    reserved: int = 0
    maintenance: int = 0
    occupancy_rate: float

class ICUOccupancy(BaseModel):
    total: int
    occupied: int
    available: int
    occupancy_rate: float

class ERLoad(BaseModel):
    current_patients: int
    waiting: int
    avg_wait_minutes: int

class OTStatusSummary(BaseModel):
    total: int
    in_use: int
    available: int
    cleaning: int = 0

class EquipmentStatusSummary(BaseModel):
    total: int
    available: int
    in_use: int
    maintenance: int

class StaffOnDuty(BaseModel):
    doctors: int
    nurses: int
    technicians: int
    total: int

class DepartmentSummary(BaseModel):
    id: int
    name: str
    type: str
    bed_occupancy_rate: float
    patient_count: int
    staff_on_duty: int
    active_alerts: int

class DashboardOverview(BaseModel):
    total_patients: int
    total_active_admissions: int
    bed_occupancy: BedOccupancy
    icu_occupancy: ICUOccupancy
    er_load: ERLoad
    ot_status: OTStatusSummary
    equipment_status: EquipmentStatusSummary
    staff_on_duty: StaffOnDuty
    active_alerts: List[AlertResponse]
    active_emergencies: int
    department_summaries: List[DepartmentSummary]
