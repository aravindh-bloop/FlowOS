from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from app.models.action import ActionType, ActionStatus

class OrchestrationActionResponse(BaseModel):
    id: int
    recommendation_id: int
    action_type: ActionType
    target_type: str
    target_id: Optional[int] = None
    parameters: Dict[str, Any]
    status: ActionStatus
    executed_at: Optional[datetime] = None
    executed_by: Optional[int] = None
    result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}

class ActionOutcomeResponse(BaseModel):
    id: int
    action_id: int
    metric_name: str
    before_value: Optional[float] = None
    after_value: Optional[float] = None
    unit: Optional[str] = None
    measured_at: datetime
    notes: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}

class ApproveActionRequest(BaseModel):
    user_id: Optional[int] = None
    notes: Optional[str] = None

class RejectActionRequest(BaseModel):
    user_id: Optional[int] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
