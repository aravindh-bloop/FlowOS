import random
from datetime import datetime, timedelta, date, time
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.models.patient import Patient, Admission, Gender, AdmissionStatus, AdmissionType, PriorityLevel
from app.models.staff import Staff, StaffRole, StaffAssignment, AssignmentType, AssignmentStatus, StaffAvailability, StaffStatus
from app.models.hospital import Department
from app.models.event import HospitalEvent
from app.schemas.patient_intake import PatientIntakeRequest, PatientIntakeResponse, DoctorMatchInfo, ConsultationDetails

# Keyword mapping to department codes
SYMPTOM_DEPARTMENT_MAP = {
    "CAR": ["chest pain", "heart", "palpitation", "high blood pressure", "hypertension", "angina", "shortness of breath on exertion", "cardiac"],
    "NEU": ["headache", "migraine", "dizziness", "vertigo", "seizure", "numbness", "tingling", "paralysis", "confusion", "neuro", "fainting"],
    "ORT": ["bone", "fracture", "joint", "knee", "spine", "back pain", "sprain", "shoulder", "swelling in ankle", "arthritis", "ligament", "hip pain"],
    "PED": ["child", "infant", "toddler", "pediatric", "vaccination", "baby fever", "child cough"],
    "SUR": ["appendix", "abdominal pain", "severe stomach ache", "hernia", "gallbladder", "wound", "laceration", "cut", "surgical consultation"],
    "OBS": ["pregnancy", "maternal", "pelvic pain", "menstrual", "gynecologic", "morning sickness", "obstetric"],
    "ONC": ["lump", "tumor", "biopsy review", "chemotherapy consult", "oncology", "unexplained weight loss"],
    "RAD": ["x-ray review", "scan consultation", "mri review", "ct report", "ultrasound"],
    "EME": ["unconscious", "collapse", "severe trauma", "heavy bleeding", "acute anaphylaxis", "sudden chest tightness", "stroke symptoms"],
    "GEN": ["fever", "cough", "cold", "flu", "weakness", "routine checkup", "fatigue", "general checkup", "diabetes check", "throat pain", "nausea"]
}

DEPARTMENT_FALLBACK_CODE = "GEN"

def identify_target_department_code(discomfort: str, symptoms: Optional[str] = None) -> str:
    text = f"{discomfort} {symptoms or ''}".lower()
    
    # Check for direct keyword matches
    for dept_code, keywords in SYMPTOM_DEPARTMENT_MAP.items():
        for kw in keywords:
            if kw in text:
                return dept_code
                
    return DEPARTMENT_FALLBACK_CODE

def find_best_matching_doctor(
    db: Session, 
    dept_code: str, 
    preferred_dept_id: Optional[int] = None, 
    preferred_doctor_id: Optional[int] = None
) -> Staff:
    """
    Finds the most suitable and available doctor based on specialization and current queue.
    """
    # 1. If preferred doctor is requested and valid
    if preferred_doctor_id:
        doc = db.query(Staff).filter(
            Staff.id == preferred_doctor_id,
            Staff.is_active == True,
            Staff.role.in_([StaffRole.DOCTOR, StaffRole.SPECIALIST, StaffRole.SURGEON, StaffRole.RESIDENT])
        ).first()
        if doc:
            return doc

    # 2. Determine target department
    target_dept = None
    if preferred_dept_id:
        target_dept = db.query(Department).filter(Department.id == preferred_dept_id).first()
    
    if not target_dept:
        target_dept = db.query(Department).filter(Department.code == dept_code).first()
        
    if not target_dept:
        target_dept = db.query(Department).filter(Department.code == DEPARTMENT_FALLBACK_CODE).first()

    dept_id = target_dept.id if target_dept else 1

    # 3. Query candidate doctors in this department
    candidate_doctors = db.query(Staff).filter(
        Staff.department_id == dept_id,
        Staff.is_active == True,
        Staff.role.in_([StaffRole.DOCTOR, StaffRole.SPECIALIST, StaffRole.SURGEON, StaffRole.RESIDENT])
    ).all()

    # If no doctor in specialized department, fallback to General Medicine or any available doctor
    if not candidate_doctors:
        gen_dept = db.query(Department).filter(Department.code == "GEN").first()
        gen_dept_id = gen_dept.id if gen_dept else 3
        candidate_doctors = db.query(Staff).filter(
            Staff.department_id == gen_dept_id,
            Staff.is_active == True,
            Staff.role.in_([StaffRole.DOCTOR, StaffRole.SPECIALIST, StaffRole.RESIDENT])
        ).all()

    if not candidate_doctors:
        candidate_doctors = db.query(Staff).filter(
            Staff.is_active == True,
            Staff.role.in_([StaffRole.DOCTOR, StaffRole.SPECIALIST, StaffRole.RESIDENT])
        ).limit(5).all()

    if not candidate_doctors:
        raise ValueError("No medical doctor is currently configured in the hospital system.")

    # 4. Check active consultation load for each candidate
    today_start = datetime.combine(date.today(), time.min)
    doctor_loads = []
    
    for doc in candidate_doctors:
        active_count = db.query(StaffAssignment).filter(
            StaffAssignment.staff_id == doc.id,
            StaffAssignment.assignment_type == AssignmentType.CONSULTATION,
            StaffAssignment.status == AssignmentStatus.ACTIVE,
            StaffAssignment.start_time >= today_start
        ).count()
        doctor_loads.append((active_count, doc))

    # Pick the doctor with minimum active consultation queue
    doctor_loads.sort(key=lambda x: x[0])
    return doctor_loads[0][1]

def process_patient_intake(db: Session, request: PatientIntakeRequest) -> PatientIntakeResponse:
    """
    Registers an outpatient, maps them to the optimal doctor based on discomfort,
    and returns scheduled consultation ticket details.
    """
    # 1. Identify target department from discomfort
    detected_dept_code = identify_target_department_code(
        request.discomfort_type, 
        request.symptoms_description
    )

    # 2. Select optimal doctor
    doctor = find_best_matching_doctor(
        db=db,
        dept_code=detected_dept_code,
        preferred_dept_id=request.preferred_department_id,
        preferred_doctor_id=request.preferred_doctor_id
    )

    dept = db.query(Department).filter(Department.id == doctor.department_id).first()
    dept_name = dept.name if dept else "General Outpatient"
    dept_code = dept.code if dept else "GEN"

    # 3. Calculate consultation queue and estimated wait time
    today_start = datetime.combine(date.today(), time.min)
    current_queue_count = db.query(StaffAssignment).filter(
        StaffAssignment.staff_id == doctor.id,
        StaffAssignment.assignment_type == AssignmentType.CONSULTATION,
        StaffAssignment.status == AssignmentStatus.ACTIVE,
        StaffAssignment.start_time >= today_start
    ).count()

    queue_position = current_queue_count + 1
    # Average consultation time is ~12-15 minutes
    wait_minutes = 5 if queue_position == 1 else (queue_position - 1) * 15
    est_start_dt = datetime.now() + timedelta(minutes=wait_minutes)
    est_start_time_str = est_start_dt.strftime("%I:%M %p")

    # Determine OPD room
    room_number = f"Room {dept.id if dept else 1}0{(doctor.id % 4) + 1} ({dept_name} OPD)"

    # Generate sequential/unique Token & MRN
    token_suffix = random.randint(10, 99)
    token_number = f"OPD-{dept_code}-{token_suffix}"
    mrn = f"MRN-{datetime.now().strftime('%y%m')}-{random.randint(1000, 9999)}"

    # 4. Database Persistence: Create Patient Record
    new_patient = Patient(
        mrn=mrn,
        first_name=request.first_name.strip().title(),
        last_name=request.last_name.strip().title(),
        date_of_birth=request.date_of_birth,
        gender=request.gender,
        contact_phone=request.contact_phone,
        emergency_contact_name=request.emergency_contact_name,
        emergency_contact_phone=request.emergency_contact_phone,
        address=request.address,
        insurance_id=request.insurance_id
    )
    db.add(new_patient)
    db.flush()  # populate new_patient.id

    # 5. Create Walk-In Outpatient Admission Record
    diagnosis_text = f"Outpatient Consultation: {request.discomfort_type}"
    if request.symptoms_description:
        diagnosis_text += f" — {request.symptoms_description.strip()}"

    admission = Admission(
        patient_id=new_patient.id,
        department_id=doctor.department_id,
        bed_id=None,  # Outpatient consultation does not hold an inpatient bed
        attending_doctor_id=doctor.id,
        admission_date=datetime.now(),
        status=AdmissionStatus.IN_TREATMENT,
        admission_type=AdmissionType.WALK_IN,
        priority=request.priority or PriorityLevel.MEDIUM,
        diagnosis=diagnosis_text,
        notes=f"OPD Token: {token_number} | Queue #{queue_position} | Est. Start: {est_start_time_str}"
    )
    db.add(admission)

    # 6. Create Staff Assignment for Consultation
    assignment = StaffAssignment(
        staff_id=doctor.id,
        patient_id=new_patient.id,
        department_id=doctor.department_id,
        assignment_type=AssignmentType.CONSULTATION,
        status=AssignmentStatus.ACTIVE,
        start_time=datetime.now(),
        notes=f"Assigned for {request.discomfort_type} (Token {token_number})"
    )
    db.add(assignment)

    # 7. Log Hospital Event
    event = HospitalEvent(
        event_type="PATIENT_ADMITTED",
        patient_id=new_patient.id,
        staff_id=doctor.id,
        department_id=doctor.department_id,
        source="OUTPATIENT_INTAKE",
        metadata_={
            "description": f"Outpatient {new_patient.first_name} {new_patient.last_name} ({token_number}) registered for {request.discomfort_type}, mapped to Dr. {doctor.first_name} {doctor.last_name} in {room_number}",
            "token_number": token_number,
            "discomfort": request.discomfort_type,
            "room_location": room_number
        }
    )
    db.add(event)

    db.commit()
    db.refresh(new_patient)

    # 8. Build detailed response
    mapping_reason = (
        f"Mapped to Dr. {doctor.first_name} {doctor.last_name} ({doctor.role.value}) based on discomfort "
        f"'{request.discomfort_type}' requiring {dept_name} specialization. "
        f"Scheduled with {current_queue_count} patient(s) currently ahead in queue."
    )

    assigned_doctor_info = DoctorMatchInfo(
        id=doctor.id,
        name=f"Dr. {doctor.first_name} {doctor.last_name}",
        role=doctor.role.value,
        specialization=doctor.specialization or dept_name,
        department_id=doctor.department_id,
        department_name=dept_name,
        room_number=room_number,
        shift_status="ON_DUTY",
        active_queue_count=current_queue_count
    )

    consultation_info = ConsultationDetails(
        token_number=token_number,
        queue_position=queue_position,
        estimated_wait_minutes=wait_minutes,
        estimated_start_time=est_start_time_str,
        room_location=room_number,
        priority=request.priority or PriorityLevel.MEDIUM,
        status="WAITING_FOR_CONSULTATION"
    )

    return PatientIntakeResponse(
        success=True,
        message=f"Patient {new_patient.first_name} {new_patient.last_name} registered successfully. Assigned to {assigned_doctor_info.name}.",
        patient_id=new_patient.id,
        mrn=new_patient.mrn,
        patient_name=f"{new_patient.first_name} {new_patient.last_name}",
        assigned_doctor=assigned_doctor_info,
        consultation=consultation_info,
        mapping_reason=mapping_reason,
        created_at=datetime.now()
    )

def get_available_doctors_list(db: Session, department_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Returns active doctors with their current queue count for optional manual selection.
    """
    query = db.query(Staff).filter(
        Staff.is_active == True,
        Staff.role.in_([StaffRole.DOCTOR, StaffRole.SPECIALIST, StaffRole.SURGEON, StaffRole.RESIDENT])
    )
    if department_id:
        query = query.filter(Staff.department_id == department_id)

    doctors = query.all()
    today_start = datetime.combine(date.today(), time.min)

    result = []
    for doc in doctors:
        dept = db.query(Department).filter(Department.id == doc.department_id).first()
        active_count = db.query(StaffAssignment).filter(
            StaffAssignment.staff_id == doc.id,
            StaffAssignment.assignment_type == AssignmentType.CONSULTATION,
            StaffAssignment.status == AssignmentStatus.ACTIVE,
            StaffAssignment.start_time >= today_start
        ).count()

        result.append({
            "id": doc.id,
            "name": f"Dr. {doc.first_name} {doc.last_name}",
            "role": doc.role.value,
            "specialization": doc.specialization or (dept.name if dept else "General"),
            "department_id": doc.department_id,
            "department_name": dept.name if dept else "General Medicine",
            "active_queue": active_count,
            "room": f"Room {doc.department_id}0{(doc.id % 4) + 1}"
        })

    # Sort by department then queue count
    result.sort(key=lambda x: (x["department_name"], x["active_queue"]))
    return result
