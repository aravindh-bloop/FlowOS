import pytest
from pydantic import ValidationError
from app.intelligence.waiting_time import waiting_time_predictor
from app.routers.intelligence import WaitingTimeRequest

def test_1_exact_example_prediction():
    """
    TEST 1:
    The exact example from the specification:
    Procedure: CT, Priority: URGENT, Hour: 14, Day: 2, etc.
    Should produce approximately 77.7 minutes.
    """
    example_input = {
        "hour": 14,
        "day_of_week": 2,
        "is_weekend": 0,
        "procedure_type": "CT",
        "patient_priority": "URGENT",
        "er_arrivals": 10,
        "admissions": 6,
        "discharges": 5,
        "er_queue": 8,
        "bed_occupancy": 0.91,
        "available_beds": 18,
        "icu_occupancy": 0.88,
        "available_icu_beds": 2,
        "ct_queue": 14,
        "mri_queue": 5,
        "equipment_utilization": 0.91,
        "staff_workload": 0.82,
        "active_emergencies": 3,
        "pending_tasks": 35,
        "historical_avg_processing_time": 42
    }

    # Validate schema
    req = WaitingTimeRequest(**example_input)
    result = waiting_time_predictor.predict(req.model_dump())
    
    assert "predicted_waiting_time_minutes" in result
    assert result["model_version"] == "1.0.0"
    
    # Expected output is ~77.7 minutes
    pred_val = result["predicted_waiting_time_minutes"]
    assert abs(pred_val - 77.7) < 1.0, f"Expected approx 77.7 minutes, got {pred_val}"

def test_2_valid_normal_request():
    """
    TEST 2:
    A valid normal request should return success=true and a numeric prediction >= 0.
    """
    normal_input = {
        "hour": 10,
        "day_of_week": 1,
        "is_weekend": 0,
        "procedure_type": "XRAY",
        "patient_priority": "NORMAL",
        "er_arrivals": 4,
        "admissions": 2,
        "discharges": 3,
        "er_queue": 2,
        "bed_occupancy": 0.70,
        "available_beds": 30,
        "icu_occupancy": 0.60,
        "available_icu_beds": 8,
        "ct_queue": 2,
        "mri_queue": 1,
        "equipment_utilization": 0.55,
        "staff_workload": 0.60,
        "active_emergencies": 0,
        "pending_tasks": 10,
        "historical_avg_processing_time": 20
    }

    req = WaitingTimeRequest(**normal_input)
    result = waiting_time_predictor.predict(req.model_dump())
    
    assert isinstance(result["predicted_waiting_time_minutes"], (int, float))
    assert result["predicted_waiting_time_minutes"] > 0
    assert result["model_version"] == "1.0.0"

def test_3_invalid_input_validation_error():
    """
    TEST 3:
    Invalid input such as hour=30 or negative queues should fail Pydantic validation.
    """
    invalid_input = {
        "hour": 30,  # Invalid: hour > 23
        "day_of_week": 2,
        "is_weekend": 0,
        "procedure_type": "CT",
        "patient_priority": "URGENT",
        "er_arrivals": 10,
        "admissions": 6,
        "discharges": 5,
        "er_queue": -5,  # Invalid: queue < 0
        "bed_occupancy": 1.5,  # Invalid: ratio > 1.0
        "available_beds": 18,
        "icu_occupancy": 0.88,
        "available_icu_beds": 2,
        "ct_queue": 14,
        "mri_queue": 5,
        "equipment_utilization": 0.91,
        "staff_workload": 0.82,
        "active_emergencies": 3,
        "pending_tasks": 35,
        "historical_avg_processing_time": 42
    }

    with pytest.raises(ValidationError) as exc_info:
        WaitingTimeRequest(**invalid_input)

    errors = exc_info.value.errors()
    error_fields = [e["loc"][0] for e in errors]
    assert "hour" in error_fields
    assert "er_queue" in error_fields
    assert "bed_occupancy" in error_fields
