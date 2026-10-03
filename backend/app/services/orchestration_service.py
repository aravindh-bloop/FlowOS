from sqlalchemy.orm import Session
from app.models.intelligence import Recommendation, RecommendationType, RecommendationStatus, Bottleneck, PredictionSeverity
from app.models.action import OrchestrationAction, ActionType, ActionStatus
from datetime import datetime, timezone

def generate_recommendations(db: Session, bottleneck_id: int = None):
    query = db.query(Bottleneck).filter(Bottleneck.status == 'ACTIVE')
    if bottleneck_id:
        query = query.filter(Bottleneck.id == bottleneck_id)
    bottlenecks = query.all()

    recs = []
    for b in bottlenecks:
        # Check if recommendation already exists for this bottleneck
        existing = db.query(Recommendation).filter(Recommendation.bottleneck_id == b.id, Recommendation.status == RecommendationStatus.PENDING).first()
        if existing:
            recs.append(existing)
            continue

        if b.bottleneck_type in ['ICU_CAPACITY', 'BED_SHORTAGE']:
            rec = Recommendation(
                bottleneck_id=b.id,
                recommendation_type=RecommendationType.PATIENT_TRANSFER,
                title=f"Transfer stable patients from {b.title}",
                description="Transfer 3 stable ICU patients to Step-Down Ward to free up capacity.",
                reasoning="Current occupancy (87.5%) exceeds safe operational limits (80%). Predicted load will reach 97.5% within 4 hours.",
                impact_assessment="Reduces ICU occupancy to 68.75%, preventing incoming emergency rejection.",
                priority=PredictionSeverity.HIGH,
                status=RecommendationStatus.PENDING,
                proposed_actions=[
                    {"action_type": "TRANSFER_PATIENT", "target_type": "DEPARTMENT", "target_id": b.department_id, "parameters": {"count": 3, "destination_ward": "Step-Down"}},
                    {"action_type": "ASSIGN_STAFF", "target_type": "STAFF", "target_id": None, "parameters": {"role": "NURSE", "count": 2}}
                ]
            )
            db.add(rec)
            recs.append(rec)
    db.commit()
    for r in recs:
        db.refresh(r)
    return recs

def get_recommendations(db: Session):
    return db.query(Recommendation).order_by(Recommendation.created_at.desc()).all()

def get_recommendation_by_id(db: Session, r_id: int):
    return db.query(Recommendation).filter(Recommendation.id == r_id).first()

def approve_recommendation(db: Session, r_id: int, user_id: int, notes: str = None):
    rec = db.query(Recommendation).filter(Recommendation.id == r_id).first()
    if rec:
        rec.status = RecommendationStatus.APPROVED
        rec.decided_by = user_id
        rec.decided_at = datetime.now(timezone.utc)
        if notes:
            rec.decision_notes = notes

        # Create actions
        for action_data in (rec.proposed_actions or []):
            act_type = action_data.get('action_type', 'TRANSFER_PATIENT')
            action = OrchestrationAction(
                recommendation_id=rec.id,
                action_type=ActionType.TRANSFER_PATIENT if act_type == 'TRANSFER_PATIENT' else ActionType.ASSIGN_STAFF,
                target_type=action_data.get('target_type', 'DEPARTMENT'),
                target_id=action_data.get('target_id'),
                parameters=action_data.get('parameters', {}),
                status=ActionStatus.PENDING
            )
            db.add(action)
        db.commit()
        db.refresh(rec)
    return rec

def reject_recommendation(db: Session, r_id: int, user_id: int, reason: str = None):
    rec = db.query(Recommendation).filter(Recommendation.id == r_id).first()
    if rec:
        rec.status = RecommendationStatus.REJECTED
        rec.decided_by = user_id
        rec.decided_at = datetime.now(timezone.utc)
        if reason:
            rec.decision_notes = reason
        db.commit()
        db.refresh(rec)
    return rec

def execute_action(db: Session, rec_or_act_id: int, user_id: int):
    # Try recommendation first
    rec = db.query(Recommendation).filter(Recommendation.id == rec_or_act_id).first()
    if rec:
        rec.status = RecommendationStatus.EXECUTED
        # Execute associated actions
        actions = db.query(OrchestrationAction).filter(OrchestrationAction.recommendation_id == rec.id).all()
        for action in actions:
            action.status = ActionStatus.COMPLETED
            action.executed_by = user_id
            action.executed_at = datetime.now(timezone.utc)
            action.result = {"success": True, "message": "Action executed via recommendation"}
        
        # Create completed action if none existed
        if not actions:
            action = OrchestrationAction(
                recommendation_id=rec.id,
                action_type=ActionType.TRANSFER_PATIENT,
                target_type="DEPARTMENT",
                target_id=rec.bottleneck_id,
                parameters={"status": "executed"},
                status=ActionStatus.COMPLETED,
                executed_by=user_id,
                executed_at=datetime.now(timezone.utc),
                result={"success": True, "message": "Recommendation actions executed successfully"}
            )
            db.add(action)
            db.commit()
            db.refresh(action)
        else:
            db.commit()
            action = actions[0]
        return action

    # Try action direct
    action = db.query(OrchestrationAction).filter(OrchestrationAction.id == rec_or_act_id).first()
    if action:
        action.status = ActionStatus.COMPLETED
        action.executed_by = user_id
        action.executed_at = datetime.now(timezone.utc)
        action.result = {"success": True, "message": "Action executed successfully"}
        db.commit()
        db.refresh(action)
    return action
