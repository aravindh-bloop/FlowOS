from sqlalchemy.orm import sessionmaker
from app.database import engine, Base
from app.models.user import User, UserRole
from app.models.hospital import Department, DepartmentType, Ward, Room, RoomType, Bed, BedType, BedStatus
from app.models.patient import Patient, Admission, AdmissionStatus, AdmissionType, Gender, PriorityLevel
from app.models.staff import Staff, StaffRole
from app.models.resource import Equipment, EquipmentType, EquipmentStatus, OperatingTheatre, TheatreType, TheatreStatus
from app.models.alert import Alert, AlertType, AlertSeverity
from app.models.clinical import Procedure, ProcedureType, ProcedureStatus, Queue, ResourceTypeEnum
from app.models.event import HospitalEvent, EventType
from app.models.intelligence import Prediction, PredictionType, PredictionSeverity, Bottleneck, BottleneckType, Recommendation, RecommendationType, RecommendationStatus
from app.services.auth_service import hash_password
from faker import Faker
import random
from datetime import datetime, timedelta, timezone

fake = Faker()

Session = sessionmaker(bind=engine)
db = Session()

def seed():
    # Clear existing schema & recreate tables cleanly
    from app.database import Base, engine
    from sqlalchemy import text
    with engine.connect() as conn:
        conn.execute(text('DROP SCHEMA public CASCADE'))
        conn.execute(text('CREATE SCHEMA public'))
        conn.commit()
    Base.metadata.create_all(bind=engine)

    # 1. Admin User
    admin = User(email="admin@flowos.com", password_hash=hash_password("admin123"), full_name="System Admin", role=UserRole.ADMIN)
    db.add(admin)
    db.commit()

    # 2. Departments
    dept_types = [
        DepartmentType.EMERGENCY, DepartmentType.ICU, DepartmentType.GENERAL_MEDICINE,
        DepartmentType.SURGERY, DepartmentType.ORTHOPEDICS, DepartmentType.CARDIOLOGY,
        DepartmentType.NEUROLOGY, DepartmentType.PEDIATRICS, DepartmentType.OBSTETRICS,
        DepartmentType.RADIOLOGY, DepartmentType.PATHOLOGY, DepartmentType.ONCOLOGY
    ]
    departments = []
    for dt in dept_types:
        d = Department(name=dt.value.replace("_", " ").title(), code=dt.name[:3], type=dt, floor=random.randint(1, 5))
        db.add(d)
        departments.append(d)
    db.commit()

    # Wards, Rooms, Beds
    wards, rooms, beds = [], [], []
    for d in departments:
        for w_idx in range(2):
            w = Ward(name=f"{d.name} Ward {w_idx+1}", department_id=d.id, floor=d.floor, capacity=10)
            db.add(w)
            wards.append(w)
    db.commit()

    for w in wards:
        for r_idx in range(2):
            r = Room(room_number=f"{w.floor}0{len(rooms)+1}", ward_id=w.id, room_type=RoomType.GENERAL, floor=w.floor, capacity=4)
            db.add(r)
            rooms.append(r)
    db.commit()

    for r in rooms:
        w = db.query(Ward).filter(Ward.id == r.ward_id).first()
        b_type = BedType.ICU if w.department_id == 2 else BedType.REGULAR
        for b_idx in range(r.capacity):
            b = Bed(bed_number=f"{r.room_number}-{b_idx+1}", room_id=r.id, ward_id=r.ward_id, department_id=w.department_id, bed_type=b_type, status=BedStatus.AVAILABLE)
            db.add(b)
            beds.append(b)
    db.commit()

    # 3. Patients (250)
    patients = []
    for _ in range(250):
        p = Patient(
            mrn=fake.unique.numerify('MRN-######'),
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            date_of_birth=fake.date_of_birth(minimum_age=1, maximum_age=90),
            gender=random.choice(list(Gender)),
            blood_type=random.choice(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+']),
            contact_phone=fake.phone_number()
        )
        db.add(p)
        patients.append(p)
    db.commit()

    # 4. Staff (70)
    staff_members = []
    for _ in range(70):
        s = Staff(
            employee_id=fake.unique.numerify('EMP-######'),
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            role=random.choice(list(StaffRole)),
            department_id=random.choice(departments).id,
            contact_phone=fake.phone_number(),
            email=fake.email()
        )
        db.add(s)
        staff_members.append(s)
    db.commit()

    # 5. Active Admissions & ICU Surge Scenario
    icu_dept = next(d for d in departments if d.type == DepartmentType.ICU)
    icu_beds = db.query(Bed).filter(Bed.department_id == icu_dept.id).all()
    
    # Fill 14 of 16 ICU beds (87.5% occupancy - ICU SURGE SCENARIO)
    for b in icu_beds[:14]:
        p = patients.pop()
        b.status = BedStatus.OCCUPIED
        b.patient_id = p.id
        adm = Admission(
            patient_id=p.id,
            department_id=icu_dept.id,
            bed_id=b.id,
            admission_date=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 4)),
            status=AdmissionStatus.ADMITTED,
            admission_type=AdmissionType.EMERGENCY,
            priority=PriorityLevel.CRITICAL,
            diagnosis="Acute Respiratory Distress / Severe Sepsis"
        )
        db.add(adm)

    # General Ward Admissions (60 additional patients)
    other_beds = db.query(Bed).filter(Bed.department_id != icu_dept.id).all()
    for b in other_beds[:60]:
        p = patients.pop()
        b.status = BedStatus.OCCUPIED
        b.patient_id = p.id
        adm = Admission(
            patient_id=p.id,
            department_id=b.department_id,
            bed_id=b.id,
            admission_date=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 7)),
            status=AdmissionStatus.ADMITTED,
            admission_type=AdmissionType.PLANNED,
            priority=random.choice([PriorityLevel.LOW, PriorityLevel.MEDIUM, PriorityLevel.HIGH]),
            diagnosis="Post-Operative Recovery / Observation"
        )
        db.add(adm)
    db.commit()

    # 6. Equipment & CT BOTTLENECK SCENARIO
    eq_list = [
        ("CT Scanner #1 (Main Radiography)", EquipmentType.CT_SCANNER, EquipmentStatus.MAINTENANCE), # CT Bottleneck trigger
        ("CT Scanner #2 (Trauma Bay)", EquipmentType.CT_SCANNER, EquipmentStatus.IN_USE),
        ("MRI 3T High Field", EquipmentType.MRI, EquipmentStatus.AVAILABLE),
        ("MRI 1.5T Open", EquipmentType.MRI, EquipmentStatus.IN_USE),
        ("Digital X-Ray Unit 1", EquipmentType.XRAY, EquipmentStatus.AVAILABLE),
        ("Digital X-Ray Unit 2", EquipmentType.XRAY, EquipmentStatus.AVAILABLE),
        ("Portable Ultrasound A", EquipmentType.ULTRASOUND, EquipmentStatus.IN_USE),
        ("Portable Ultrasound B", EquipmentType.ULTRASOUND, EquipmentStatus.AVAILABLE),
        ("ICU Ventilator Alpha", EquipmentType.VENTILATOR, EquipmentStatus.IN_USE),
        ("ICU Ventilator Beta", EquipmentType.VENTILATOR, EquipmentStatus.IN_USE),
        ("Cardiac Monitor Station 1", EquipmentType.CARDIAC_MONITOR, EquipmentStatus.AVAILABLE),
        ("Cardiac Monitor Station 2", EquipmentType.CARDIAC_MONITOR, EquipmentStatus.IN_USE),
    ]
    for name, eq_t, stat in eq_list:
        eq = Equipment(name=name, type=eq_t, department_id=10, status=stat, location="Floor 2 Radiography")
        db.add(eq)
    db.commit()

    # 7. Operating Theatres (6 OTs)
    ot_list = [
        ("OT 1 - Trauma & Emergency", TheatreType.EMERGENCY, TheatreStatus.IN_USE),
        ("OT 2 - Cardiac Surgery", TheatreType.CARDIAC, TheatreStatus.IN_USE),
        ("OT 3 - Neurosurgery Suite", TheatreType.NEURO, TheatreStatus.CLEANING),
        ("OT 4 - Orthopedic Surgery", TheatreType.ORTHOPEDIC, TheatreStatus.AVAILABLE),
        ("OT 5 - General Surgery Suite A", TheatreType.GENERAL, TheatreStatus.IN_USE),
        ("OT 6 - General Surgery Suite B", TheatreType.GENERAL, TheatreStatus.AVAILABLE),
    ]
    for name, t_type, stat in ot_list:
        ot = OperatingTheatre(name=name, theatre_number=name[:4], department_id=4, theatre_type=t_type, status=stat)
        db.add(ot)
    db.commit()

    # 8. Queues (CT Diagnostic Queue Bottleneck)
    for i in range(7):
        p = patients.pop()
        q = Queue(
            patient_id=p.id,
            department_id=10, # Radiology
            resource_type=ResourceTypeEnum.EQUIPMENT,
            priority=PriorityLevel.HIGH if i < 3 else PriorityLevel.MEDIUM,
            position=i + 1,
            status='WAITING',
            estimated_wait_minutes=45 + (i * 15),
            joined_at=datetime.now(timezone.utc) - timedelta(minutes=30 + i * 10)
        )
        db.add(q)
    db.commit()

    # 9. Pre-seeded Alerts
    alerts_data = [
        (AlertType.ICU_CAPACITY, AlertSeverity.CRITICAL, "ICU Occupancy Critical (87.5%)", "14 out of 16 ICU beds occupied. Predicted capacity failure in 4 hours.", 2),
        (AlertType.EQUIPMENT_FAILURE, AlertSeverity.HIGH, "CT Scanner #1 Offline for Maintenance", "Main radiography CT scanner undergoing emergency repair. Queue accumulating.", 10),
        (AlertType.QUEUE_DELAY, AlertSeverity.HIGH, "Diagnostic Queue Delay in Radiology", "7 patients waiting for CT scans. Average wait time 65 minutes.", 10),
        (AlertType.STAFF_OVERLOAD, AlertSeverity.MEDIUM, "High Nurse Workload in Emergency Dept", "Emergency nurse ratio at 1:8 due to walk-in volume.", 1),
    ]
    for a_type, sev, title, msg, dept_id in alerts_data:
        al = Alert(alert_type=a_type, severity=sev, title=title, message=msg, department_id=dept_id, is_active=True)
        db.add(al)
    db.commit()

    # 10. Pre-seeded Events
    events_data = [
        (EventType.PATIENT_ADMITTED, "Patient admitted to ICU Bay 4", 2),
        (EventType.BED_ASSIGNED, "Bed ICU-04 assigned to Patient MRN-482910", 2),
        (EventType.EQUIPMENT_UNAVAILABLE, "CT Scanner #1 set to Maintenance status", 10),
        (EventType.ALERT_CREATED, "Critical Alert: ICU Occupancy reached 87.5%", 2),
        (EventType.PROCEDURE_STARTED, "Emergency Laparotomy started in OT 1", 4),
    ]
    for e_type, src, dept_id in events_data:
        ev = HospitalEvent(event_type=e_type, source=src, department_id=dept_id)
        db.add(ev)
    db.commit()

    # 11. Pre-generated AI Predictions & Bottlenecks
    p1 = Prediction(
        prediction_type=PredictionType.ICU_DEMAND,
        target_department_id=2,
        current_value=87.5,
        predicted_value=97.5,
        confidence=0.88,
        severity=PredictionSeverity.CRITICAL,
        reasoning="ICU currently at 87.5% occupancy with 3 incoming emergency admissions projected within 4 hours.",
        recommended_action="Transfer 3 stable patients to Step-Down ward.",
        time_horizon_hours=4,
        valid_from=datetime.now(timezone.utc),
        valid_until=datetime.now(timezone.utc) + timedelta(hours=4)
    )
    db.add(p1)

    b1 = Bottleneck(
        bottleneck_type=BottleneckType.ICU_CAPACITY,
        severity=PredictionSeverity.HIGH,
        department_id=2,
        title="ICU Capacity Threshold Exceeded",
        description="ICU occupancy is at 87.5% (14/16 beds filled). Step-down transfer required immediately.",
        affected_patient_count=14,
        status='ACTIVE',
        detected_at=datetime.now(timezone.utc)
    )
    db.add(b1)
    db.commit()

    r1 = Recommendation(
        bottleneck_id=b1.id,
        prediction_id=p1.id,
        recommendation_type=RecommendationType.PATIENT_TRANSFER,
        title="Transfer 3 Stable Patients to Step-Down Unit",
        description="Transfer 3 recovered ICU patients to Ward 2 (Step-Down) to lower ICU occupancy from 87.5% to 68.75%.",
        reasoning="Prevents predicted ICU overflow (97.5%) in 4 hours and frees 3 critical beds for trauma arrivals.",
        impact_assessment="Improves ICU availability buffer by +18.75% with zero risk to transferred patients.",
        priority=PredictionSeverity.HIGH,
        status=RecommendationStatus.PENDING,
        proposed_actions=[
            {"action_type": "TRANSFER_PATIENT", "target_type": "DEPARTMENT", "target_id": 2, "parameters": {"count": 3, "destination_ward": "Step-Down Ward"}},
            {"action_type": "ASSIGN_STAFF", "target_type": "STAFF", "target_id": None, "parameters": {"role": "NURSE", "count": 2}}
        ]
    )
    db.add(r1)
    db.commit()

    print("Comprehensive Flow OS Seed Complete: 250 Patients, 70 Staff, 221 Beds, ICU Surge & CT Bottleneck scenarios active!")

if __name__ == '__main__':
    seed()
