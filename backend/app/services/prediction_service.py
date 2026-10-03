from sqlalchemy.orm import Session
from app.models.intelligence import Prediction, PredictionType, PredictionSeverity
from app.models.hospital import Department, Bed, BedStatus, DepartmentType
from datetime import datetime, timedelta

def generate_predictions(db: Session):
    predictions = []
    departments = db.query(Department).all()
    for dept in departments:
        beds = db.query(Bed).filter(Bed.department_id == dept.id).all()
        total_beds = len(beds)
        if total_beds == 0:
            continue
        occupied = sum(1 for b in beds if b.status == BedStatus.OCCUPIED)
        occupancy_rate = occupied / total_beds
        
        pred_type = PredictionType.ICU_DEMAND if dept.type == DepartmentType.ICU else PredictionType.BED_DEMAND
        predicted_occ = occupancy_rate + 0.1
        severity = PredictionSeverity.LOW
        if predicted_occ > 0.9:
            severity = PredictionSeverity.CRITICAL
        elif predicted_occ > 0.8:
            severity = PredictionSeverity.HIGH
            
        pred = Prediction(
            prediction_type=pred_type,
            target_department_id=dept.id,
            current_value=occupancy_rate * 100,
            predicted_value=min(predicted_occ * 100, 100.0),
            confidence=0.85,
            severity=severity,
            reasoning=f"{dept.name} currently at {occupancy_rate*100:.1f}% with pending admissions.",
            recommended_action="Prepare overflow beds" if severity in [PredictionSeverity.HIGH, PredictionSeverity.CRITICAL] else "Monitor situation",
            time_horizon_hours=4,
            valid_from=datetime.utcnow(),
            valid_until=datetime.utcnow() + timedelta(hours=4)
        )
        db.add(pred)
        predictions.append(pred)
        
    db.commit()
    return predictions

def get_predictions(db: Session):
    return db.query(Prediction).order_by(Prediction.created_at.desc()).all()
