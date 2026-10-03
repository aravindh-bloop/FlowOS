from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.staff import StaffResponse, StaffAvailabilityResponse, StaffAssignmentResponse
from app.services.staff_service import get_staff, get_staff_detail, get_staff_availability, get_staff_assignments
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/staff", tags=["staff"])

@router.get("", response_model=List[StaffResponse])
def read_staff(role: str = None, department_id: int = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return get_staff(db, role, department_id)

@router.get("/{id}", response_model=StaffResponse)
def read_staff_detail(id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    staff = get_staff_detail(db, id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    return staff

@router.get("/{id}/availability", response_model=List[StaffAvailabilityResponse])
def read_staff_availability(id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return get_staff_availability(db, id)

@router.get("/{id}/assignments", response_model=List[StaffAssignmentResponse])
def read_staff_assignments(id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return get_staff_assignments(db, id)
