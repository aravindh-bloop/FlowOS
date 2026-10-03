from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
from app.models.intelligence import PredictionType, PredictionSeverity, BottleneckType, BottleneckStatus, RecommendationType, RecommendationStatus

class PredictionResponse(BaseModel):
    id: int
    prediction_type: PredictionType
    target_department_id: Optional[int] = None
    target_resource_type: Optional[str] = None
    target_resource_id: Optional[int] = None
    current_value: Optional[float] = None
    predicted_value: float
    confidence: float
    severity: PredictionSeverity
    reasoning: str
    recommended_action: Optional[str] = None
    time_horizon_hours: int
    valid_from: datetime
    valid_until: datetime
    metadata_: Optional[Dict[str, Any]] = None
    created_at: datetime
    model_config = {"from_attributes": True}

class RecommendationResponse(BaseModel):
    id: int
    bottleneck_id: Optional[int] = None
    prediction_id: Optional[int] = None
    recommendation_type: RecommendationType
    title: str
    description: str
    reasoning: str
    impact_assessment: Optional[str] = None
    priority: PredictionSeverity
    status: RecommendationStatus
    proposed_actions: List[Dict[str, Any]]
    decided_by: Optional[int] = None
    decided_at: Optional[datetime] = None
    decision_notes: Optional[str] = None
    created_at: datetime
    expires_at: Optional[datetime] = None
    model_config = {"from_attributes": True}

class BottleneckResponse(BaseModel):
    id: int
    bottleneck_type: BottleneckType
    severity: PredictionSeverity
    department_id: Optional[int] = None
    resource_type: Optional[str] = None
    resource_id: Optional[int] = None
    title: str
    description: str
    affected_patient_count: int
    affected_patients: Optional[List[int]] = None
    contributing_factors: Optional[Dict[str, Any]] = None
    detected_at: datetime
    resolved_at: Optional[datetime] = None
    status: BottleneckStatus
    metadata_: Optional[Dict[str, Any]] = None
    created_at: datetime
    model_config = {"from_attributes": True}

class BottleneckDetail(BottleneckResponse):
    recommendations: List[RecommendationResponse] = []
    model_config = {"from_attributes": True}
