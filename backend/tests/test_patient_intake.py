import pytest
from datetime import date
from app.database import SessionLocal
from app.schemas.patient_intake import PatientIntakeRequest
from app.services.patient_intake_service import process_patient_intake, identify_target_department_code
from app.models.patient import Gender, PriorityLevel

def test_symptom_classification():
    assert identify_target_department_code("Acute chest pain and tightness") == "CAR"
    assert identify_target_department_code("Bone fracture in leg") == "ORT"
    assert identify_target_department_code("Severe migraine headache") == "NEU"
    assert identify_target_department_code("Child cough and high fever") == "PED"
    assert identify_target_department_code("Routine annual wellness check") == "GEN"

def test_outpatient_intake_mapping_cardiology():
    db = SessionLocal()
    req = PatientIntakeRequest(
        first_name="Marcus",
        last_name="Testington",
        date_of_birth=date(1988, 7, 19),
        gender=Gender.MALE,
        contact_phone="+1-555-9988",
        discomfort_type="Chest pain and palpitations",
        priority=PriorityLevel.HIGH
    )
    res = process_patient_intake(db, req)
    assert res.success is True
    assert res.consultation.token_number.startswith("OPD-CAR-")
    assert "Cardiology" in res.assigned_doctor.department_name
    assert res.consultation.queue_position >= 1
    assert res.consultation.estimated_wait_minutes >= 5

def test_outpatient_intake_mapping_orthopedics():
    db = SessionLocal()
    req = PatientIntakeRequest(
        first_name="Chloe",
        last_name="Sample",
        date_of_birth=date(1996, 11, 4),
        gender=Gender.FEMALE,
        contact_phone="+1-555-7766",
        discomfort_type="Fractured wrist bone deformity",
        priority=PriorityLevel.MEDIUM
    )
    res = process_patient_intake(db, req)
    assert res.success is True
    assert res.consultation.token_number.startswith("OPD-ORT-")
    assert "Orthopedics" in res.assigned_doctor.department_name
