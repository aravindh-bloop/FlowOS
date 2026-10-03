from datetime import datetime, date, timedelta, timezone
from app.database import SessionLocal
from app.models.patient import Patient, Admission, Gender, AdmissionStatus, AdmissionType, PriorityLevel
from app.models.hospital import Department, Ward, Room, Bed, RoomType, BedType, BedStatus
from app.models.staff import Staff, StaffRole
from app.models.clinical import Procedure, ProcedureType, ProcedureStatus
from app.models.event import HospitalEvent, EventType

def seed_akshayasri_patient():
    db = SessionLocal()
    try:
        # 1. Check or find department (General Medicine or create/use ID 3)
        dept = db.query(Department).filter(Department.id == 3).first()
        if not dept:
            dept = db.query(Department).first()

        # 2. Check or find Ward
        ward = db.query(Ward).filter(Ward.department_id == dept.id).first()
        if not ward:
            ward = Ward(name="Inpatient Care Ward 3", department_id=dept.id, floor=3)
            db.add(ward)
            db.commit()
            db.refresh(ward)

        # 3. Check or create Room 304B
        room = db.query(Room).filter(Room.room_number == "Room 304B").first()
        if not room:
            room = Room(
                room_number="Room 304B",
                ward_id=ward.id,
                room_type=RoomType.PRIVATE,
                floor=3,
                capacity=1
            )
            db.add(room)
            db.commit()
            db.refresh(room)

        # 4. Check or create Bed 304B
        bed = db.query(Bed).filter(Bed.bed_number == "304B").first()
        if not bed:
            bed = Bed(
                bed_number="304B",
                room_id=room.id,
                ward_id=ward.id,
                department_id=dept.id,
                bed_type=BedType.REGULAR,
                status=BedStatus.OCCUPIED,
                is_active=True
            )
            db.add(bed)
            db.commit()
            db.refresh(bed)

        # 5. Check or create Staff: Dr. Robert Vance
        doctor = db.query(Staff).filter(Staff.employee_id == "DOC-VANCE-01").first()
        if not doctor:
            doctor = Staff(
                employee_id="DOC-VANCE-01",
                first_name="Robert",
                last_name="Vance",
                role=StaffRole.DOCTOR,
                specialization="Orthopedic Surgery & Rehabilitation",
                department_id=dept.id,
                contact_phone="+1-555-010-4412",
                email="r.vance@flowos.internal",
                is_active=True
            )
            db.add(doctor)
            db.commit()
            db.refresh(doctor)

        # 6. Check or create Staff: Murali Krishnan, RN
        nurse = db.query(Staff).filter(Staff.employee_id == "NUR-KRISHNAN-01").first()
        if not nurse:
            nurse = Staff(
                employee_id="NUR-KRISHNAN-01",
                first_name="Murali",
                last_name="Krishnan",
                role=StaffRole.NURSE,
                specialization="Lead Staff Nurse",
                department_id=dept.id,
                contact_phone="+1-555-010-7731",
                email="m.krishnan@flowos.internal",
                is_active=True
            )
            db.add(nurse)
            db.commit()
            db.refresh(nurse)

        # 7. Check or create Patient: AkshayaSri
        patient = db.query(Patient).filter(Patient.first_name == "AkshayaSri").first()
        if not patient:
            patient = Patient(
                mrn="MRN-304B01",
                first_name="AkshayaSri",
                last_name="S",
                date_of_birth=date(2006, 5, 18),  # Age 20
                gender=Gender.FEMALE,
                blood_type="O+",
                contact_phone="+1-555-019-3042",
                emergency_contact_name="Sarah Jensen",
                emergency_contact_phone="+1-555-019-8821",
                address="Room 304B, FlowOS Care Center",
                insurance_id="INS-FL-89211"
            )
            db.add(patient)
            db.commit()
            db.refresh(patient)
            print(f"Created Patient: {patient.first_name} {patient.last_name} (ID: {patient.id}, MRN: {patient.mrn})")
        else:
            print(f"Existing Patient: {patient.first_name} {patient.last_name} (ID: {patient.id})")

        # Associate patient with bed
        bed.patient_id = patient.id
        bed.status = BedStatus.OCCUPIED
        db.commit()

        # 8. Check or create Admission (Day of stay = 2)
        admission_time = datetime.now(timezone.utc) - timedelta(days=2, hours=3)
        admission = db.query(Admission).filter(Admission.patient_id == patient.id).first()
        if not admission:
            admission = Admission(
                patient_id=patient.id,
                department_id=dept.id,
                bed_id=bed.id,
                attending_doctor_id=doctor.id,
                admission_date=admission_time,
                status=AdmissionStatus.ADMITTED,
                admission_type=AdmissionType.PLANNED,
                priority=PriorityLevel.MEDIUM,
                diagnosis="Mental Illness",
                notes="Patient admitted for comprehensive psychiatric care, observation, and multidisciplinary recovery handoff."
            )
            db.add(admission)
            db.commit()
            db.refresh(admission)
            print(f"Created Admission ID {admission.id} for {patient.first_name}")

        # 9. Create Procedures
        procs_data = [
            ("Post-Op Ultrasound", ProcedureType.DIAGNOSTIC, ProcedureStatus.COMPLETED, timedelta(hours=6)),
            ("Afternoon Physical Therapy", ProcedureType.THERAPEUTIC, ProcedureStatus.IN_PROGRESS, timedelta(hours=2)),
            ("Wound Dressing Inspection", ProcedureType.THERAPEUTIC, ProcedureStatus.SCHEDULED, timedelta(hours=-2)),
        ]
        for name, p_type, p_status, time_offset in procs_data:
            existing = db.query(Procedure).filter(Procedure.patient_id == patient.id, Procedure.name == name).first()
            if not existing:
                start_t = datetime.now(timezone.utc) - time_offset
                proc = Procedure(
                    patient_id=patient.id,
                    name=name,
                    procedure_type=p_type,
                    status=p_status,
                    scheduled_start=start_t,
                    department_id=dept.id,
                    surgeon_id=doctor.id,
                    created_at=start_t,
                )
                db.add(proc)
        db.commit()

        # 10. Create Multidisciplinary Hospital Events & Caretaker Logs
        now_dt = datetime.now(timezone.utc)
        events_to_seed = [
            # Caretaker observation (crossword, tea)
            {
                "event_type": EventType.STAFF_ASSIGNED,
                "source": "CARETAKER: Sarah Jensen",
                "offset": timedelta(minutes=45),
                "metadata": {
                    "role": "CARETAKER",
                    "actor": "Sarah Jensen",
                    "actor_title": "Primary Caretaker",
                    "title": "Bedside Comfort Observation",
                    "body": "Eleanor requested crossword puzzle after herbal tea. Room temperature adjusted, spirits high.",
                    "category": "observation",
                    "tone": "amber",
                    "quote": "Eleanor requested crossword puzzle after herbal tea. Room temperature adjusted, spirits high.",
                    "audioSeconds": 38,
                }
            },
            # Caretaker mobility walk
            {
                "event_type": EventType.STAFF_ASSIGNED,
                "source": "CARETAKER: Sarah Jensen",
                "offset": timedelta(hours=1, minutes=15),
                "metadata": {
                    "role": "CARETAKER",
                    "actor": "Sarah Jensen",
                    "actor_title": "Primary Caretaker",
                    "title": "Assisted Hallway Mobility Walk",
                    "body": "Assisted hallway stroll at 10:15 AM, walker used throughout. 35 meters covered steadily.",
                    "stream": "mobility",
                    "category": "mobility",
                    "tone": "mint",
                    "scale": "Walker Supported",
                    "amount": {"value": 35, "unit": "meters", "outcome": "Distance"},
                }
            },
            # Doctor rounds
            {
                "event_type": EventType.PROCEDURE_COMPLETED,
                "source": "DOCTOR: Dr. Robert Vance, MD",
                "offset": timedelta(hours=2),
                "metadata": {
                    "role": "DOCTOR",
                    "actor": "Dr. Robert Vance, MD",
                    "actor_title": "Attending Orthopedic Surgeon",
                    "title": "Attending Rounds & Incision Assessment",
                    "body": "Surgical incision clean, dry, and intact. Good peripheral perfusion. Cleared for assisted bedside ambulation.",
                    "category": "Doctor Rounds",
                    "tone": "navy",
                }
            },
            # Nurse vitals check
            {
                "event_type": EventType.STAFF_ASSIGNED,
                "source": "NURSE: Murali Krishnan, RN",
                "offset": timedelta(hours=2, minutes=30),
                "metadata": {
                    "role": "NURSE",
                    "actor": "Murali Krishnan, RN",
                    "actor_title": "Lead Staff Nurse",
                    "title": "Continuous Vitals Telemetry Check",
                    "body": "Heart rate 72 bpm steady, SpO2 98% room air, BP 118/76 mmHg. Hydration goal tracking at 1,450 / 2,000 mL.",
                    "stream": "status",
                    "category": "Vitals Telemetry",
                    "tone": "forest",
                }
            },
            # Caretaker hydration log
            {
                "event_type": EventType.STAFF_ASSIGNED,
                "source": "CARETAKER: Sarah Jensen",
                "offset": timedelta(hours=3),
                "metadata": {
                    "role": "CARETAKER",
                    "actor": "Sarah Jensen",
                    "actor_title": "Primary Caretaker",
                    "title": "Breakfast Nutrition & Hydration",
                    "body": "450ml water logged, scrambled eggs & fruit cup at breakfast. 85% nutritional intake accomplished.",
                    "stream": "food",
                    "category": "food",
                    "tone": "pink",
                    "scale": "85% Meal Completed",
                    "amount": {"value": 450, "unit": "ml", "outcome": "Fluids"},
                }
            },
            # Nurse analgesic dose
            {
                "event_type": EventType.STAFF_ASSIGNED,
                "source": "NURSE: Murali Krishnan, RN",
                "offset": timedelta(hours=3, minutes=30),
                "metadata": {
                    "role": "NURSE",
                    "actor": "Murali Krishnan, RN",
                    "actor_title": "Lead Staff Nurse",
                    "title": "Analgesic Dose Administered",
                    "body": "Oral analgesic dose administered with water. Pain reduced to 3/10 mild dull flank ache.",
                    "stream": "medication",
                    "category": "Medication Admin",
                    "tone": "emerald",
                }
            },
            # Admission event
            {
                "event_type": EventType.PATIENT_ADMITTED,
                "source": "ADMISSION: Intake Desk",
                "offset": timedelta(days=2),
                "metadata": {
                    "role": "ADMISSION",
                    "actor": "Hospital Admissions Desk",
                    "actor_title": "Patient Intake & Triage",
                    "title": "Patient Admitted to Room 304B",
                    "body": "Admitted via Planned Admission to Room 304B (Bed 304B). Priority: Medium. Admitting diagnosis: Mental Illness. Attending: Dr. Robert Vance, MD. Primary Nurse: Murali Krishnan, RN.",
                    "category": "Intake & Triage",
                    "tone": "teal",
                }
            },
        ]

        for item in events_to_seed:
            ev = HospitalEvent(
                event_type=item["event_type"],
                patient_id=patient.id,
                source=item["source"],
                metadata_=item["metadata"],
                timestamp=now_dt - item["offset"],
            )
            db.add(ev)
        db.commit()

        print(f"Successfully seeded AkshayaSri (ID {patient.id}) with Admission, Procedures, and {len(events_to_seed)} Events!")
        return patient.id
    except Exception as e:
        db.rollback()
        print(f"Error seeding AkshayaSri patient: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_akshayasri_patient()
