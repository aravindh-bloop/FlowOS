from sqlalchemy.orm import Session
from app.models.staff import Staff, StaffAvailability, StaffAssignment

def get_staff(db: Session, role: str = None, department_id: int = None):
    query = db.query(Staff)
    if role:
        query = query.filter(Staff.role == role)
    if department_id:
        query = query.filter(Staff.department_id == department_id)
    return query.all()

def get_staff_detail(db: Session, staff_id: int):
    return db.query(Staff).filter(Staff.id == staff_id).first()

def get_staff_availability(db: Session, staff_id: int):
    return db.query(StaffAvailability).filter(StaffAvailability.staff_id == staff_id).all()

def get_staff_assignments(db: Session, staff_id: int):
    return db.query(StaffAssignment).filter(StaffAssignment.staff_id == staff_id).all()
