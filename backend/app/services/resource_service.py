from sqlalchemy.orm import Session
from app.models.resource import Equipment, OperatingTheatre
from app.models.hospital import Bed, BedStatus

def get_equipment(db: Session):
    return db.query(Equipment).all()

def get_beds(db: Session):
    return db.query(Bed).all()

def get_bed_summary_by_department(db: Session, department_id: int):
    beds = db.query(Bed).filter(Bed.department_id == department_id).all()
    total = len(beds)
    available = sum(1 for b in beds if b.status == BedStatus.AVAILABLE)
    occupied = sum(1 for b in beds if b.status == BedStatus.OCCUPIED)
    reserved = sum(1 for b in beds if b.status == BedStatus.RESERVED)
    maintenance = sum(1 for b in beds if b.status == BedStatus.MAINTENANCE)
    utilization_rate = (occupied / total * 100) if total > 0 else 0
    return {
        "total_beds": total,
        "available_beds": available,
        "occupied_beds": occupied,
        "reserved_beds": reserved,
        "maintenance_beds": maintenance,
        "utilization_rate": utilization_rate
    }

def get_operating_theatres(db: Session):
    return db.query(OperatingTheatre).all()
