from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.resource import EquipmentResponse, OperatingTheatreResponse
from app.services.resource_service import get_equipment, get_operating_theatres
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/resources", tags=["resources"])

@router.get("", response_model=List[EquipmentResponse])
def read_resources(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return get_equipment(db)

@router.get("/operating-theatres", response_model=List[OperatingTheatreResponse])
def read_operating_theatres(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return get_operating_theatres(db)
