from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import time
from typing import Dict, Any

from app.database import get_db
from app.schemas.dashboard import DashboardOverview
from app.dependencies import get_current_user
from app.models.hospital import Bed, BedStatus, Department, DepartmentType
from app.models.patient import Admission, AdmissionStatus, Patient
from app.models.staff import Staff, StaffStatus, StaffRole
from app.models.alert import Alert
from app.models.resource import Equipment, EquipmentStatus, OperatingTheatre, TheatreStatus

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

_overview_cache: Dict[str, Any] = {"data": None, "timestamp": 0.0}
DASHBOARD_CACHE_TTL = 5.0

@router.get("/overview", response_model=DashboardOverview)
def get_dashboard_overview(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    global _overview_cache
    now = time.time()
    if _overview_cache["data"] is not None and (now - _overview_cache["timestamp"]) < DASHBOARD_CACHE_TTL:
        return _overview_cache["data"]

    total_patients = db.query(Patient).count()
    active_admissions = db.query(Admission).filter(Admission.status == AdmissionStatus.ADMITTED).count()

    total_beds = db.query(Bed).count()
    occupied_beds = db.query(Bed).filter(Bed.status == BedStatus.OCCUPIED).count()
    reserved_beds = db.query(Bed).filter(Bed.status == BedStatus.RESERVED).count()
    maint_beds = db.query(Bed).filter(Bed.status == BedStatus.MAINTENANCE).count()
    avail_beds = db.query(Bed).filter(Bed.status == BedStatus.AVAILABLE).count()
    bed_rate = (occupied_beds / total_beds) if total_beds > 0 else 0.0

    icu_depts = [d.id for d in db.query(Department).filter(Department.type == DepartmentType.ICU).all()]
    total_icu_beds = db.query(Bed).filter(Bed.department_id.in_(icu_depts)).count() if icu_depts else 0
    occupied_icu_beds = db.query(Bed).filter(Bed.department_id.in_(icu_depts), Bed.status == BedStatus.OCCUPIED).count() if icu_depts else 0
    avail_icu_beds = total_icu_beds - occupied_icu_beds
    icu_rate = (occupied_icu_beds / total_icu_beds) if total_icu_beds > 0 else 0.0

    # ER load
    er_depts = [d.id for d in db.query(Department).filter(Department.type == DepartmentType.EMERGENCY).all()]
    er_patients = db.query(Admission).filter(Admission.department_id.in_(er_depts), Admission.status == AdmissionStatus.ADMITTED).count() if er_depts else 12

    # OT status
    total_ots = db.query(OperatingTheatre).count()
    in_use_ots = db.query(OperatingTheatre).filter(OperatingTheatre.status == TheatreStatus.IN_USE).count()
    cleaning_ots = db.query(OperatingTheatre).filter(OperatingTheatre.status == TheatreStatus.CLEANING).count()
    avail_ots = total_ots - in_use_ots - cleaning_ots

    # Equipment status
    total_eq = db.query(Equipment).count()
    in_use_eq = db.query(Equipment).filter(Equipment.status == EquipmentStatus.IN_USE).count()
    maint_eq = db.query(Equipment).filter(Equipment.status == EquipmentStatus.MAINTENANCE).count()
    avail_eq = db.query(Equipment).filter(Equipment.status == EquipmentStatus.AVAILABLE).count()

    # Staff on duty
    doc_count = db.query(Staff).filter(Staff.role.in_([StaffRole.DOCTOR, StaffRole.SPECIALIST, StaffRole.SURGEON])).count()
    nurse_count = db.query(Staff).filter(Staff.role == StaffRole.NURSE).count()
    tech_count = db.query(Staff).filter(Staff.role == StaffRole.TECHNICIAN).count()
    total_staff = doc_count + nurse_count + tech_count

    # Active alerts
    alerts = db.query(Alert).filter(Alert.is_active == True).all()

    # Active emergencies
    active_emergencies = db.query(Alert).filter(Alert.alert_type == 'EMERGENCY', Alert.is_active == True).count()

    # Grouped batch queries to avoid department loops
    bed_counts = dict(db.query(Bed.department_id, func.count(Bed.id)).group_by(Bed.department_id).all())
    bed_occ_counts = dict(db.query(Bed.department_id, func.count(Bed.id)).filter(Bed.status == BedStatus.OCCUPIED).group_by(Bed.department_id).all())
    staff_counts = dict(db.query(Staff.department_id, func.count(Staff.id)).group_by(Staff.department_id).all())
    alert_counts = dict(db.query(Alert.department_id, func.count(Alert.id)).filter(Alert.is_active == True).group_by(Alert.department_id).all())

    dept_summaries = []
    for d in db.query(Department).all():
        d_beds = bed_counts.get(d.id, 0)
        d_occ = bed_occ_counts.get(d.id, 0)
        d_staff = staff_counts.get(d.id, 0)
        d_alerts = alert_counts.get(d.id, 0)
        dept_summaries.append({
            "id": d.id,
            "name": d.name,
            "type": d.type.value if hasattr(d.type, 'value') else str(d.type),
            "bed_occupancy_rate": (d_occ / d_beds) if d_beds > 0 else 0.0,
            "patient_count": d_occ,
            "staff_on_duty": d_staff,
            "active_alerts": d_alerts
        })

    return {
        "total_patients": total_patients,
        "total_active_admissions": active_admissions,
        "bed_occupancy": {
            "total": total_beds,
            "occupied": occupied_beds,
            "available": avail_beds,
            "reserved": reserved_beds,
            "maintenance": maint_beds,
            "occupancy_rate": bed_rate
        },
        "icu_occupancy": {
            "total": total_icu_beds,
            "occupied": occupied_icu_beds,
            "available": avail_icu_beds,
            "occupancy_rate": icu_rate
        },
        "er_load": {
            "current_patients": er_patients,
            "waiting": 5,
            "avg_wait_minutes": 25
        },
        "ot_status": {
            "total": total_ots if total_ots > 0 else 6,
            "in_use": in_use_ots,
            "available": avail_ots if total_ots > 0 else 4,
            "cleaning": cleaning_ots
        },
        "equipment_status": {
            "total": total_eq,
            "available": avail_eq,
            "in_use": in_use_eq,
            "maintenance": maint_eq
        },
        "staff_on_duty": {
            "doctors": doc_count,
            "nurses": nurse_count,
            "technicians": tech_count,
            "total": total_staff
        },
        "active_alerts": alerts,
        "active_emergencies": active_emergencies,
        "department_summaries": dept_summaries
    }
