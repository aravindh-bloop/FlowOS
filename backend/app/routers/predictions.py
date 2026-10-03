from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.intelligence import PredictionResponse
from app.services.prediction_service import get_predictions, generate_predictions
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/predictions", tags=["predictions"])

@router.get("", response_model=List[PredictionResponse])
def read_predictions(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return get_predictions(db)

@router.post("/generate", response_model=List[PredictionResponse])
def trigger_predictions(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return generate_predictions(db)
