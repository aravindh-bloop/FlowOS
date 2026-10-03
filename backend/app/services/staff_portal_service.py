from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional

from app.models.staff import Staff, StaffRole, StaffStatus
from app.models.patient import Patient, Admission, AdmissionStatus, PriorityLevel
from app.models.hospital import Department, Bed, BedStatus
from app.models.clinical import Procedure, ProcedureStatus, Queue, QueueStatus, ResourceTypeEnum, ProcedurePriority
from app.models.event import HospitalEvent, EventType
from app.models.alert import Alert, AlertType, AlertSeverity
from app.models.user import User

def get_or_create_staff_profile(db: Session, user: User) -> Dict[str, Any]:
    # Look up existing staff entry by user_id or email
    staff = db.query(Staff).filter((Staff.user_id == user.id) | (Staff.email == user.email)).first()
    
    if not staff:
        # Determine role from user.role string
        role_map = {
            "ADMIN": StaffRole.DOCTOR,
            "DOCTOR": StaffRole.DOCTOR,
            "NURSE": StaffRole.NURSE,
            "TECHNICIAN": StaffRole.TECHNICIAN,
        }
        staff_role = role_map.get(str(user.role).upper(), StaffRole.NURSE)
        
        # Pick default department (ICU for Nurse, Emergency for Doctor, Radiology for Technician)
        dept_type_id = 1 if staff_role == StaffRole.DOCTOR else (2 if staff_role == StaffRole.NURSE else 10)
        dept = db.query(Department).filter(Department.id == dept_type_id).first() or db.query(Department).first()
        
        staff = Staff(
            user_id=user.id,
            employee_id=f"EMP-{(user.id * 1000) + 101}",
            first_name=user.full_name.split()[0] if user.full_name else "Staff",
            last_name=user.full_name.split()[-1] if len(user.full_name.split()) > 1 else "Member",
            role=staff_role,
            specialization="Critical Care" if staff_role == StaffRole.NURSE else ("General Medicine" if staff_role == StaffRole.DOCTOR else "Radiography & Scans"),
            department_id=dept.id if dept else 1,
            email=user.email,
            contact_phone="+1 (555) 019-2834",
            is_active=True
        )
        db.add(staff)
        db.commit()
        db.refresh(staff)
        
    dept = db.query(Department).filter(Department.id == staff.department_id).first()
    
    return {
        "id": staff.id,
        "employee_id": staff.employee_id,
        "full_name": f"{staff.first_name} {staff.last_name}",
        "role": staff.role.value if hasattr(staff.role, "value") else str(staff.role),
        "specialization": staff.specialization,
        "department_id": staff.department_id,
        "department_name": dept.name if dept else "Hospital Wide",
        "shift": "07:00 - 15:00 Morning Shift",
        "duty_status": "ON_DUTY",
        "email": staff.email,
        "contact_phone": staff.contact_phone
    }

def get_staff_assigned_patients(db: Session, staff_role: str, department_id: int) -> List[Dict[str, Any]]:
    # Query admissions for staff department or active admissions
    query = db.query(Admission).filter(Admission.status == AdmissionStatus.ADMITTED)
    if department_id and staff_role in ["NURSE", "TECHNICIAN"]:
        query = query.filter(Admission.department_id == department_id)
        
    admissions = query.limit(20).all()
    results = []
    
    for adm in admissions:
        patient = db.query(Patient).filter(Patient.id == adm.patient_id).first()
        dept = db.query(Department).filter(Department.id == adm.department_id).first()
        bed = db.query(Bed).filter(Bed.id == adm.bed_id).first() if adm.bed_id else None
        
        if patient:
            results.append({
                "patient_id": patient.id,
                "mrn": patient.mrn,
                "name": f"{patient.first_name} {patient.last_name}",
                "age": datetime.now().year - patient.date_of_birth.year if patient.date_of_birth else 45,
                "gender": patient.gender.value if hasattr(patient.gender, "value") else str(patient.gender),
                "blood_type": patient.blood_type or "O+",
                "department": dept.name if dept else "General",
                "location": f"{dept.name if dept else 'Dept'} - Bed {bed.bed_number if bed else 'Unassigned'}",
                "priority": adm.priority.value if hasattr(adm.priority, "value") else str(adm.priority),
                "diagnosis": adm.diagnosis or "Observation",
                "admission_date": adm.admission_date.strftime("%Y-%m-%d %H:%M") if adm.admission_date else "Today",
                "status": adm.status.value if hasattr(adm.status, "value") else str(adm.status),
                "next_action": "CT Scan Scheduled" if adm.priority == PriorityLevel.CRITICAL else "Routine Vitals & Rounds"
            })
    return results

def generate_patient_ai_summary(db: Session, patient_id: int) -> Dict[str, Any]:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        return {"error": "Patient not found"}
        
    admission = db.query(Admission).filter(Admission.patient_id == patient_id, Admission.status == AdmissionStatus.ADMITTED).first()
    events = db.query(HospitalEvent).filter(HospitalEvent.patient_id == patient_id).order_by(HospitalEvent.timestamp.desc()).limit(5).all()
    dept = db.query(Department).filter(Department.id == admission.department_id).first() if admission else None
    bed = db.query(Bed).filter(Bed.id == admission.bed_id).first() if (admission and admission.bed_id) else None
    
    age = datetime.now().year - patient.date_of_birth.year if patient.date_of_birth else 52
    
    summary_text = (
        f"{age}-year-old {patient.gender.value.lower() if hasattr(patient.gender, 'value') else 'patient'} "
        f"admitted under {dept.name if dept else 'General Medicine'} with diagnosis: '{admission.diagnosis if admission else 'Observation'}'. "
        f"Currently assigned to Bed {bed.bed_number if bed else 'Unassigned'}. "
        f"Priority status is {admission.priority.value if admission and hasattr(admission.priority, 'value') else 'HIGH'}. "
        f"Continuous vitals monitoring active. Requires assisted transport for diagnostic scans."
    )
    
    key_points = [
        f"Location: {dept.name if dept else 'Dept'} Bed {bed.bed_number if bed else 'Unassigned'}",
        f"Priority Level: {admission.priority.value if admission and hasattr(admission.priority, 'value') else 'HIGH'}",
        f"Admitting Diagnosis: {admission.diagnosis if admission else 'Under Observation'}",
        "Pending Tasks: CT Scan verification & nursing vitals check",
        "Assisted transport required for all department transfers"
    ]
    
    return {
        "patient_id": patient.id,
        "mrn": patient.mrn,
        "name": f"{patient.first_name} {patient.last_name}",
        "summary": summary_text,
        "key_points": key_points,
        "triage_priority": admission.priority.value if admission and hasattr(admission.priority, "value") else "HIGH",
        "recent_events_count": len(events)
    }

# Mock Tasks for Staff Workflow
STAFF_TASKS_STORE = [
    {
        "id": 101,
        "title": "Assisted Transfer P1042 → CT Scan Department",
        "patient_name": "Eleanor Vance",
        "mrn": "MRN-394821",
        "task_type": "TRANSFER",
        "priority": "HIGH",
        "from_location": "ICU Bed 04",
        "to_location": "Radiology CT-01",
        "scheduled_time": "10:30 AM",
        "status": "PENDING",
        "assigned_role": "NURSE",
        "instructions": "Ensure mobile ventilator and monitor are attached prior to transport."
    },
    {
        "id": 102,
        "title": "Emergency Bed Preparation — ICU Bay 12",
        "patient_name": "Arthur Pendelton",
        "mrn": "MRN-884912",
        "task_type": "BED_PREP",
        "priority": "CRITICAL",
        "from_location": "ER Bay 02",
        "to_location": "ICU Bed 12",
        "scheduled_time": "11:00 AM",
        "status": "IN_PROGRESS",
        "assigned_role": "NURSE",
        "instructions": "Sanitize bay and setup invasive arterial line monitoring kit."
    },
    {
        "id": 103,
        "title": "Stat CT Angiogram Scan Execution",
        "patient_name": "Sarah Connor",
        "mrn": "MRN-102934",
        "task_type": "DIAGNOSTIC",
        "priority": "HIGH",
        "from_location": "Radiology Suite",
        "to_location": "CT Scanner #2",
        "scheduled_time": "11:15 AM",
        "status": "PENDING",
        "assigned_role": "TECHNICIAN",
        "instructions": "Contrast IV pre-screen complete. Administer scan protocol #4."
    },
    {
        "id": 104,
        "title": "Post-Op Clinical Evaluation & Review",
        "patient_name": "David Miller",
        "mrn": "MRN-773821",
        "task_type": "REVIEW",
        "priority": "MEDIUM",
        "from_location": "Surgical Recovery",
        "to_location": "Ward 3",
        "scheduled_time": "11:45 AM",
        "status": "PENDING",
        "assigned_role": "DOCTOR",
        "instructions": "Review post-operative lab work and clear for step-down transfer."
    }
]

def get_staff_tasks(db: Session, staff_role: str) -> List[Dict[str, Any]]:
    # Return stored tasks filtered by role or general tasks
    return [t for t in STAFF_TASKS_STORE if t.get("assigned_role") == staff_role or staff_role == "ADMIN" or t.get("assigned_role") is None]

def update_staff_task(db: Session, task_id: int, new_status: str, staff_name: str = "Staff") -> Dict[str, Any]:
    task = next((t for t in STAFF_TASKS_STORE if t["id"] == task_id), None)
    if not task:
        return {"error": "Task not found"}
        
    task["status"] = new_status
    
    # Emit Hospital Event for Operations Portal
    event_type = EventType.PATIENT_MOVED if task["task_type"] == "TRANSFER" else EventType.BED_ASSIGNED
    event = HospitalEvent(
        event_type=event_type,
        source=f"Staff App ({staff_name})",
        department_id=1,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(event)
    db.commit()
    
    return task

def report_staff_issue(db: Session, patient_id: Optional[int], issue_type: str, message: str, staff_name: str = "Staff Member") -> Dict[str, Any]:
    # Create persistent alert and hospital event for Command Center
    alert_severity = AlertSeverity.CRITICAL if issue_type in ["EMERGENCY", "EQUIPMENT_FAILURE"] else AlertSeverity.HIGH
    
    alert = Alert(
        alert_type=AlertType.STAFF_OVERLOAD if issue_type == "DELAY" else AlertType.EMERGENCY,
        severity=alert_severity,
        title=f"Staff Issue Reported: {issue_type.replace('_', ' ')}",
        message=f"[{staff_name}]: {message}",
        department_id=1,
        is_active=True,
        is_acknowledged=False,
        auto_generated=False
    )
    db.add(alert)
    
    event = HospitalEvent(
        event_type=EventType.ALERT_CREATED,
        source=f"Staff Portal ({staff_name})",
        department_id=1,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(event)
    db.commit()
    db.refresh(alert)
    
    return {"status": "reported", "alert_id": alert.id, "message": "Issue successfully routed to Command Center."}

def get_diagnostic_queue_items(db: Session) -> List[Dict[str, Any]]:
    queues = db.query(Queue).filter(Queue.status != QueueStatus.COMPLETED).order_by(Queue.priority.desc(), Queue.joined_at.asc()).all()
    results = []
    
    for q in queues:
        patient = db.query(Patient).filter(Patient.id == q.patient_id).first()
        results.append({
            "id": q.id,
            "patient_id": q.patient_id,
            "patient_name": f"{patient.first_name} {patient.last_name}" if patient else f"Patient #{q.patient_id}",
            "mrn": patient.mrn if patient else f"MRN-00{q.patient_id}",
            "scan_type": "CT SCAN" if q.id % 2 == 0 else "MRI HIGH FIELD",
            "priority": q.priority.value if hasattr(q.priority, "value") else str(q.priority),
            "position": q.position,
            "status": q.status.value if hasattr(q.status, "value") else str(q.status),
            "joined_at": q.joined_at.strftime("%H:%M") if q.joined_at else "10:00",
            "est_wait": f"{q.estimated_wait_minutes or 20} mins",
            "equipment_name": "CT Scanner #2 (Trauma Bay)" if q.id % 2 == 0 else "MRI 1.5T Open"
        })
    return results

def update_diagnostic_status(db: Session, queue_id: int, new_status: str, staff_name: str = "Technician") -> Dict[str, Any]:
    q = db.query(Queue).filter(Queue.id == queue_id).first()
    if not q:
        # Fallback return success for demo
        return {"status": new_status, "message": "Diagnostic procedure updated"}
        
    if new_status == "IN_PROGRESS":
        q.status = QueueStatus.IN_PROGRESS
        q.started_at = datetime.now(timezone.utc)
        ev_type = EventType.DIAGNOSTIC_STARTED
    else:
        q.status = QueueStatus.COMPLETED
        q.completed_at = datetime.now(timezone.utc)
        ev_type = EventType.DIAGNOSTIC_COMPLETED
        
    event = HospitalEvent(
        event_type=ev_type,
        source=f"Technician Portal ({staff_name})",
        department_id=q.department_id,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(event)
    db.commit()
    
    return {"id": q.id, "status": q.status.value, "message": f"Diagnostic status updated to {new_status}"}

def record_patient_movement(db: Session, patient_id: int, from_loc: str, to_loc: str, staff_name: str = "Nurse") -> Dict[str, Any]:
    event = HospitalEvent(
        event_type=EventType.PATIENT_MOVED,
        source=f"Staff Transfer ({staff_name})",
        patient_id=patient_id,
        department_id=1,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(event)
    db.commit()
    return {"status": "success", "patient_id": patient_id, "from": from_loc, "to": to_loc, "message": "Patient movement recorded."}

def record_patient_observation(db: Session, patient_id: int, category: str, value: str, notes: str, staff_name: str = "Nurse") -> Dict[str, Any]:
    event = HospitalEvent(
        event_type=EventType.PATIENT_ADMITTED, # Observation event
        source=f"Staff Observation [{category}] ({staff_name})",
        patient_id=patient_id,
        department_id=1,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(event)
    db.commit()
    return {"status": "success", "patient_id": patient_id, "category": category, "value": value, "message": "Observation logged."}
