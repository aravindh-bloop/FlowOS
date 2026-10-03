from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from app.database import get_db
from app.dependencies import get_current_user
from app.services.staff_portal_service import (
    get_or_create_staff_profile,
    get_staff_assigned_patients,
    generate_patient_ai_summary,
    get_staff_tasks,
    update_staff_task,
    report_staff_issue,
    get_diagnostic_queue_items,
    update_diagnostic_status,
    record_patient_movement,
    record_patient_observation
)

router = APIRouter(prefix="/api/staff-portal", tags=["staff-portal"])

class TaskStatusUpdate(BaseModel):
    status: str

class IssueReportRequest(BaseModel):
    patient_id: Optional[int] = None
    issue_type: str
    message: str

class PatientMovementRequest(BaseModel):
    from_location: str
    to_location: str

class PatientObservationRequest(BaseModel):
    category: str
    value: str
    notes: Optional[str] = None

class DiagnosticStatusUpdate(BaseModel):
    status: str

@router.get("/me")
def read_staff_profile(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return get_or_create_staff_profile(db, current_user)

@router.get("/my-patients")
def read_my_patients(role: Optional[str] = "NURSE", department_id: Optional[int] = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    profile = get_or_create_staff_profile(db, current_user)
    effective_role = role or profile["role"]
    effective_dept = department_id or profile["department_id"]
    return get_staff_assigned_patients(db, staff_role=effective_role, department_id=effective_dept)

@router.get("/patient-summary/{patient_id}")
def read_patient_ai_summary(patient_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return generate_patient_ai_summary(db, patient_id)

@router.get("/tasks")
def read_tasks(role: Optional[str] = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    profile = get_or_create_staff_profile(db, current_user)
    effective_role = role or profile["role"]
    return get_staff_tasks(db, staff_role=effective_role)

@router.post("/tasks/{task_id}/status")
def update_task(task_id: int, payload: TaskStatusUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    profile = get_or_create_staff_profile(db, current_user)
    return update_staff_task(db, task_id=task_id, new_status=payload.status, staff_name=profile["full_name"])

@router.post("/report-issue")
def report_issue(payload: IssueReportRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    profile = get_or_create_staff_profile(db, current_user)
    return report_staff_issue(db, patient_id=payload.patient_id, issue_type=payload.issue_type, message=payload.message, staff_name=profile["full_name"])

@router.get("/diagnostics/queue")
def read_diagnostics_queue(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return get_diagnostic_queue_items(db)

@router.post("/diagnostics/{queue_id}/status")
def update_diagnostic(queue_id: int, payload: DiagnosticStatusUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    profile = get_or_create_staff_profile(db, current_user)
    return update_diagnostic_status(db, queue_id=queue_id, new_status=payload.status, staff_name=profile["full_name"])

@router.post("/patients/{patient_id}/movement")
def move_patient(patient_id: int, payload: PatientMovementRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    profile = get_or_create_staff_profile(db, current_user)
    return record_patient_movement(db, patient_id=patient_id, from_loc=payload.from_location, to_loc=payload.to_location, staff_name=profile["full_name"])

@router.post("/patients/{patient_id}/observations")
def log_observation(patient_id: int, payload: PatientObservationRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    profile = get_or_create_staff_profile(db, current_user)
    return record_patient_observation(db, patient_id=patient_id, category=payload.category, value=payload.value, notes=payload.notes or "", staff_name=profile["full_name"])
