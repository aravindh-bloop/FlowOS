from sqlalchemy.orm import Session
from app.models.intelligence import Bottleneck, BottleneckType, PredictionSeverity, BottleneckStatus
from app.models.hospital import Department, Bed, BedStatus, DepartmentType
from app.models.patient import Admission
from datetime import datetime

def detect_bottlenecks(db: Session):
    bottlenecks = []
    departments = db.query(Department).all()
    for dept in departments:
        beds = db.query(Bed).filter(Bed.department_id == dept.id).all()
        total_beds = len(beds)
        if total_beds == 0:
            continue
        occupied_beds = sum(1 for b in beds if b.status == BedStatus.OCCUPIED)
        occupancy = occupied_beds / total_beds
        
        if occupancy > 0.85:
            b_type = BottleneckType.ICU_CAPACITY if dept.type == DepartmentType.ICU else BottleneckType.BED_SHORTAGE
            b_severity = PredictionSeverity.CRITICAL if occupancy >= 0.95 else PredictionSeverity.HIGH
            b = Bottleneck(
                bottleneck_type=b_type,
                severity=b_severity,
                department_id=dept.id,
                title=f"High occupancy in {dept.name}",
                description=f"{dept.name} is at {occupancy*100:.1f}% capacity.",
                affected_patient_count=occupied_beds,
                detected_at=datetime.utcnow(),
                status=BottleneckStatus.ACTIVE
            )
            db.add(b)
            bottlenecks.append(b)
    db.commit()
    return bottlenecks

def get_bottlenecks(db: Session):
    return db.query(Bottleneck).filter(Bottleneck.status == BottleneckStatus.ACTIVE).order_by(Bottleneck.detected_at.desc()).all()

def get_bottleneck_detail(db: Session, b_id: int):
    return db.query(Bottleneck).filter(Bottleneck.id == b_id).first()
