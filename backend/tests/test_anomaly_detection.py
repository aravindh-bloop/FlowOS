import pytest
from app.intelligence.anomalydetection import hybrid_detector

def test_case_1_normal_state():
    """
    CASE 1 — Normal:
    Should return: is_anomaly = False, overall_severity = NORMAL
    """
    normal_state = {
        "hour": 10,
        "day_of_week": 2,
        "is_weekend": 0,
        "er_arrivals": 5,
        "admissions": 3,
        "discharges": 4,
        "er_queue": 3,
        "bed_occupancy": 0.75,
        "available_beds": 35,
        "icu_occupancy": 0.70,
        "available_icu_beds": 6,
        "ct_queue": 4,
        "mri_queue": 3,
        "equipment_utilization": 0.65,
        "avg_diagnostic_wait": 30.0,
        "staff_workload": 0.60,
        "active_emergencies": 0,
        "avg_transfer_time": 15.0,
        "pending_tasks": 15
    }
    
    result = hybrid_detector.detect_anomalies(normal_state)
    assert result["is_anomaly"] is False
    assert result["overall_severity"] == "NORMAL"
    assert len(result["operational_anomalies"]) == 0

def test_case_2_icu_pressure():
    """
    CASE 2 — ICU pressure:
    icu_occupancy = 0.995, available_icu_beds = 0
    Should detect: icu_pressure, severity = CRITICAL
    """
    icu_pressure_state = {
        "hour": 14,
        "day_of_week": 3,
        "is_weekend": 0,
        "er_arrivals": 8,
        "admissions": 5,
        "discharges": 2,
        "er_queue": 5,
        "bed_occupancy": 0.90,
        "available_beds": 10,
        "icu_occupancy": 0.995,
        "available_icu_beds": 0,
        "ct_queue": 6,
        "mri_queue": 4,
        "equipment_utilization": 0.75,
        "avg_diagnostic_wait": 40.0,
        "staff_workload": 0.80,
        "active_emergencies": 1,
        "avg_transfer_time": 25.0,
        "pending_tasks": 25
    }

    result = hybrid_detector.detect_anomalies(icu_pressure_state)
    assert result["is_anomaly"] is True
    assert result["overall_severity"] == "CRITICAL"
    
    detected_types = [a["type"] for a in result["operational_anomalies"]]
    assert "icu_pressure" in detected_types
    
    icu_anomaly = next(a for a in result["operational_anomalies"] if a["type"] == "icu_pressure")
    assert icu_anomaly["severity"] == "CRITICAL"

def test_case_3_diagnostic_bottleneck():
    """
    CASE 3 — Diagnostic bottleneck:
    ct_queue = 25, avg_diagnostic_wait = 95
    Should detect: diagnostic_bottleneck, severity = HIGH
    """
    diagnostic_bottleneck_state = {
        "hour": 11,
        "day_of_week": 1,
        "is_weekend": 0,
        "er_arrivals": 6,
        "admissions": 4,
        "discharges": 3,
        "er_queue": 4,
        "bed_occupancy": 0.82,
        "available_beds": 20,
        "icu_occupancy": 0.80,
        "available_icu_beds": 4,
        "ct_queue": 25,
        "mri_queue": 8,
        "equipment_utilization": 0.88,
        "avg_diagnostic_wait": 95.0,
        "staff_workload": 0.75,
        "active_emergencies": 0,
        "avg_transfer_time": 20.0,
        "pending_tasks": 20
    }

    result = hybrid_detector.detect_anomalies(diagnostic_bottleneck_state)
    assert result["is_anomaly"] is True
    assert result["overall_severity"] == "HIGH"
    
    detected_types = [a["type"] for a in result["operational_anomalies"]]
    assert "diagnostic_bottleneck" in detected_types

if __name__ == "__main__":
    test_case_1_normal_state()
    test_case_2_icu_pressure()
    test_case_3_diagnostic_bottleneck()
    print("All 3 Anomaly Detection test cases PASSED successfully!")
