from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional, Any, Dict
from app.database import get_db
from app.schemas.patient import PatientResponse, PatientDetail
from app.schemas.patient_intake import PatientIntakeRequest, PatientIntakeResponse
from app.services.patient_service import get_patients, get_patient_detail
from app.services.patient_intake_service import process_patient_intake, get_available_doctors_list
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/patients", tags=["patients"])

@router.get("", response_model=List[PatientResponse])
def read_patients(
    department_id: Optional[int] = None, 
    status: Optional[str] = None, 
    search: Optional[str] = None, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    return get_patients(db, department_id, status, search)

@router.get("/available-doctors", response_model=List[Dict[str, Any]])
def get_doctors_for_intake(
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Returns available doctors with department and active queue count for intake selection.
    """
    return get_available_doctors_list(db, department_id)

@router.post("/intake", response_model=PatientIntakeResponse, status_code=status.HTTP_201_CREATED)
@router.post("/register-outpatient", response_model=PatientIntakeResponse, status_code=status.HTTP_201_CREATED)
def register_outpatient_intake(
    request: PatientIntakeRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Registers an outpatient checkup/consultation. 
    Automatically maps the patient to the best matching doctor based on discomfort,
    specialization, and doctor availability/schedule.
    """
    try:
        response = process_patient_intake(db, request)
        return response
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Failed to process patient intake: {str(e)}"
        )

@router.get("/{id}", response_model=PatientDetail)
def read_patient(
    id: int, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    patient = get_patient_detail(db, id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient
