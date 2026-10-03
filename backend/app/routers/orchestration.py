from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas.intelligence import RecommendationResponse
from app.schemas.action import OrchestrationActionResponse, ApproveActionRequest, RejectActionRequest
from app.services.orchestration_service import generate_recommendations, get_recommendations, get_recommendation_by_id, approve_recommendation, reject_recommendation, execute_action
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/orchestration", tags=["orchestration"])

@router.post("/recommend", response_model=List[RecommendationResponse])
def create_recommendations(bottleneck_id: Optional[int] = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return generate_recommendations(db, bottleneck_id=bottleneck_id)

@router.get("/recommendations", response_model=List[RecommendationResponse])
def read_recommendations(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return get_recommendations(db)

@router.get("/recommendations/{id}", response_model=RecommendationResponse)
def read_recommendation(id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    r = get_recommendation_by_id(db, id)
    if not r:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return r

@router.post("/actions/{id}/approve", response_model=RecommendationResponse)
def approve_action(id: int, request: Optional[ApproveActionRequest] = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    uid = (request.user_id if request and request.user_id else current_user.id)
    notes = (request.notes if request else None)
    return approve_recommendation(db, id, uid, notes=notes)

@router.post("/actions/{id}/reject", response_model=RecommendationResponse)
def reject_action(id: int, request: Optional[RejectActionRequest] = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    uid = (request.user_id if request and request.user_id else current_user.id)
    reason = (request.reason or request.notes if request else None)
    return reject_recommendation(db, id, uid, reason=reason)

@router.post("/actions/{id}/execute", response_model=OrchestrationActionResponse)
def execute_act(id: int, request: Optional[ApproveActionRequest] = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    uid = (request.user_id if request and request.user_id else current_user.id)
    return execute_action(db, id, uid)
