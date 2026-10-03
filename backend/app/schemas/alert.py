from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from app.models.alert import AlertType, AlertSeverity, NotificationType

class AlertResponse(BaseModel):
    id: int
    alert_type: AlertType
    severity: AlertSeverity
    title: str
    message: str
    department_id: Optional[int] = None
    patient_id: Optional[int] = None
    resource_type: Optional[str] = None
    resource_id: Optional[int] = None
    is_active: bool
    is_acknowledged: bool
    acknowledged_by: Optional[int] = None
    acknowledged_at: Optional[datetime] = None
    auto_generated: bool
    metadata_: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = {"from_attributes": True}

class NotificationResponse(BaseModel):
    id: int
    alert_id: Optional[int] = None
    user_id: Optional[int] = None
    staff_id: Optional[int] = None
    title: str
    message: str
    notification_type: NotificationType
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    model_config = {"from_attributes": True}

class AcknowledgeAlertRequest(BaseModel):
    user_id: Optional[int] = None
