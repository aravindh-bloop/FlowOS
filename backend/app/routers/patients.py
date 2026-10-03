from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.patient import PatientResponse, PatientDetail
from app.services.patient_service import get_patients, get_patient_detail
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/patients", tags=["patients"])

@router.get("", response_model=List[PatientResponse])
def read_patients(department_id: int = None, status: str = None, search: str = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return get_patients(db, department_id, status, search)

@router.get("/{id}", response_model=PatientDetail)
def read_patient(id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    patient = get_patient_detail(db, id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient
