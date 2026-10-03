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

from app.models.event import HospitalEvent

def get_patient_detail(db: Session, patient_id: int):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        return None

    # Enrich admissions with department, bed, and doctor names
    for adm in patient.admissions:
        if adm.department:
            setattr(adm, "department_name", adm.department.name)
        if adm.bed:
            setattr(adm, "bed_number", adm.bed.bed_number)
        if adm.attending_doctor:
            setattr(adm, "attending_doctor_name", f"Dr. {adm.attending_doctor.first_name} {adm.attending_doctor.last_name}")

    # Fetch events for this patient
    events = (
        db.query(HospitalEvent)
        .filter(HospitalEvent.patient_id == patient_id)
        .order_by(HospitalEvent.timestamp.desc())
        .all()
    )
    setattr(patient, "events", events)
    setattr(patient, "current_admission", patient.admissions[0] if patient.admissions else None)

    return patient
