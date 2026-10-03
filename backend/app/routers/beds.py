from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.hospital import BedResponse, BedSummary
from app.services.resource_service import get_beds, get_bed_summary_by_department
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/beds", tags=["beds"])

@router.get("", response_model=List[BedResponse])
def read_beds(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return get_beds(db)

@router.get("/summary", response_model=BedSummary)
def read_bed_summary(department_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return get_bed_summary_by_department(db, department_id)
