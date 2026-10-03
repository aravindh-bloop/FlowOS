import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Enum, func, JSON
from app.database import Base

class ActionType(str, enum.Enum):
    ASSIGN_BED = "ASSIGN_BED"
    TRANSFER_PATIENT = "TRANSFER_PATIENT"
    ASSIGN_STAFF = "ASSIGN_STAFF"
    REASSIGN_STAFF = "REASSIGN_STAFF"
    PRIORITIZE_QUEUE = "PRIORITIZE_QUEUE"
    RESERVE_OT = "RESERVE_OT"
    RESERVE_EQUIPMENT = "RESERVE_EQUIPMENT"
    CREATE_ALERT = "CREATE_ALERT"
    SEND_NOTIFICATION = "SEND_NOTIFICATION"
    ACTIVATE_EMERGENCY_PROTOCOL = "ACTIVATE_EMERGENCY_PROTOCOL"

class ActionStatus(str, enum.Enum):
    PENDING = "PENDING"
    EXECUTING = "EXECUTING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class OrchestrationAction(Base):
    __tablename__ = "orchestration_actions"
    
    id = Column(Integer, primary_key=True, index=True)
    recommendation_id = Column(Integer, ForeignKey("recommendations.id"), nullable=False)
    action_type = Column(Enum(ActionType), nullable=False)
    target_type = Column(String(50), nullable=False)
    target_id = Column(Integer, nullable=True)
    parameters = Column(JSON, nullable=False)
    status = Column(Enum(ActionStatus), default=ActionStatus.PENDING)
    executed_at = Column(DateTime, nullable=True)
    executed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    result = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class ActionOutcome(Base):
    __tablename__ = "action_outcomes"
    
    id = Column(Integer, primary_key=True, index=True)
    action_id = Column(Integer, ForeignKey("orchestration_actions.id"), nullable=False)
    metric_name = Column(String(255), nullable=False)
    before_value = Column(Float, nullable=True)
    after_value = Column(Float, nullable=True)
    unit = Column(String(50), nullable=True)
    measured_at = Column(DateTime, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
