from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.patient import Patient, Admission

def get_patients(db: Session, department_id: int = None, status: str = None, search: str = None):
    query = db.query(Patient)
    if search:
        query = query.filter(or_(Patient.first_name.ilike(f"%{search}%"), Patient.last_name.ilike(f"%{search}%"), Patient.mrn.ilike(f"%{search}%")))
    if department_id or status:
        query = query.join(Admission)
        if department_id:
            query = query.filter(Admission.department_id == department_id)
        if status:
            query = query.filter(Admission.status == status)
    return query.all()

def get_patient_detail(db: Session, patient_id: int):
    return db.query(Patient).filter(Patient.id == patient_id).first()
