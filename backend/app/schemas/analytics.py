from pydantic import BaseModel
from typing import List, Optional

class DepartmentAnalytics(BaseModel):
    department_id: int
    department_name: str
    bed_utilization: float
    avg_wait_minutes: float
    patient_count: int
    staff_utilization: float

class AnalyticsResponse(BaseModel):
    avg_waiting_time_minutes: float
    admission_to_bed_minutes: float
    bed_utilization: float
    icu_utilization: float
    ot_utilization: float
    diagnostic_turnaround_minutes: float
    staff_utilization: float
    emergency_response_minutes: float
    resource_idle_rate: float
    department_analytics: List[DepartmentAnalytics]

    model_config = {"from_attributes": True}
