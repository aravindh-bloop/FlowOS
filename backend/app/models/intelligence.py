import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Enum, func, JSON
from app.database import Base

class PredictionType(str, enum.Enum):
    PATIENT_LOAD = "PATIENT_LOAD"
    BED_DEMAND = "BED_DEMAND"
    ICU_DEMAND = "ICU_DEMAND"
    DIAGNOSTIC_DEMAND = "DIAGNOSTIC_DEMAND"
    STAFF_DEMAND = "STAFF_DEMAND"
    EMERGENCY_LOAD = "EMERGENCY_LOAD"

class PredictionSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class BottleneckType(str, enum.Enum):
    ICU_CAPACITY = "ICU_CAPACITY"
    BED_SHORTAGE = "BED_SHORTAGE"
    DIAGNOSTIC_QUEUE = "DIAGNOSTIC_QUEUE"
    OT_UTILIZATION = "OT_UTILIZATION"
    STAFF_OVERLOAD = "STAFF_OVERLOAD"
    EQUIPMENT_SHORTAGE = "EQUIPMENT_SHORTAGE"
    EMERGENCY_OVERLOAD = "EMERGENCY_OVERLOAD"

class BottleneckStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    MONITORING = "MONITORING"
    RESOLVED = "RESOLVED"
    ESCALATED = "ESCALATED"

class RecommendationType(str, enum.Enum):
    BED_ASSIGNMENT = "BED_ASSIGNMENT"
    STAFF_REALLOCATION = "STAFF_REALLOCATION"
    PATIENT_TRANSFER = "PATIENT_TRANSFER"
    QUEUE_PRIORITY = "QUEUE_PRIORITY"
    OT_SCHEDULING = "OT_SCHEDULING"
    EQUIPMENT_REALLOCATION = "EQUIPMENT_REALLOCATION"
    EMERGENCY_RESPONSE = "EMERGENCY_RESPONSE"
    CAPACITY_ADJUSTMENT = "CAPACITY_ADJUSTMENT"

class RecommendationStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    MODIFIED = "MODIFIED"
    REJECTED = "REJECTED"
    EXECUTED = "EXECUTED"
    EXPIRED = "EXPIRED"

class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, index=True)
    prediction_type = Column(Enum(PredictionType), nullable=False)
    target_department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    target_resource_type = Column(String(50), nullable=True)
    target_resource_id = Column(Integer, nullable=True)
    current_value = Column(Float, nullable=True)
    predicted_value = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    severity = Column(Enum(PredictionSeverity), nullable=False)
    reasoning = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=True)
    time_horizon_hours = Column(Integer, nullable=False)
    valid_from = Column(DateTime, nullable=False)
    valid_until = Column(DateTime, nullable=False)
    metadata_ = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class Bottleneck(Base):
    __tablename__ = "bottlenecks"
    id = Column(Integer, primary_key=True, index=True)
    bottleneck_type = Column(Enum(BottleneckType), nullable=False)
    severity = Column(Enum(PredictionSeverity), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    resource_type = Column(String(50), nullable=True)
    resource_id = Column(Integer, nullable=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    affected_patient_count = Column(Integer, default=0)
    affected_patients = Column(JSON, nullable=True)
    contributing_factors = Column(JSON, nullable=True)
    detected_at = Column(DateTime, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    status = Column(Enum(BottleneckStatus), default=BottleneckStatus.ACTIVE)
    metadata_ = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(Integer, primary_key=True, index=True)
    bottleneck_id = Column(Integer, ForeignKey("bottlenecks.id"), nullable=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), nullable=True)
    recommendation_type = Column(Enum(RecommendationType), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    reasoning = Column(Text, nullable=False)
    impact_assessment = Column(Text, nullable=True)
    priority = Column(Enum(PredictionSeverity), nullable=False)
    status = Column(Enum(RecommendationStatus), default=RecommendationStatus.PENDING)
    proposed_actions = Column(JSON, nullable=False)
    decided_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    decided_at = Column(DateTime, nullable=True)
    decision_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    expires_at = Column(DateTime, nullable=True)
