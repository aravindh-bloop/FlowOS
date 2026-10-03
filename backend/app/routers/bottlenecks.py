from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.intelligence import BottleneckResponse, BottleneckDetail
from app.services.bottleneck_service import get_bottlenecks, get_bottleneck_detail, detect_bottlenecks
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/bottlenecks", tags=["bottlenecks"])

@router.get("", response_model=List[BottleneckResponse])
def read_bottlenecks(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return get_bottlenecks(db)

@router.get("/{id}", response_model=BottleneckDetail)
def read_bottleneck(id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    b = get_bottleneck_detail(db, id)
    if not b:
        raise HTTPException(status_code=404, detail="Bottleneck not found")
    return b

@router.post("/detect", response_model=List[BottleneckResponse])
def trigger_bottlenecks(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return detect_bottlenecks(db)
