"""Tests for Flow OS Operational Staff Workload Forecaster Service & API Endpoint."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from services.workload_forecaster import (
    WorkloadForecaster,
    predict_staff_workload,
    FeatureValidationError,
    ModelLoadError,
)

client = TestClient(app)


@pytest.fixture
def sample_workload_payload():
    """Exact sample payload from user specification."""
    return {
        "hour": 14,
        "day_of_week": 2,
        "is_weekend": 0,

        "er_arrivals": 12,
        "admissions": 7,
        "discharges": 5,

        "patient_load": 105.0,

        "icu_occupancy": 0.86,
        "available_icu_beds": 3,

        "ct_queue": 12,
        "mri_queue": 5,

        "active_emergencies": 2,
        "pending_tasks": 45,

        "available_staff": 28,
        "staff_workload": 0.78,

        "staff_workload_lag1": 0.76,
        "staff_workload_lag24": 0.72,
        "staff_workload_lag168": 0.70,
        "staff_workload_rolling24": 0.73,

        "patient_staff_ratio": 3.75,
        "task_staff_ratio": 1.61,
        "emergency_pressure": 0.071,
        "diagnostic_pressure": 0.607
    }


def test_workload_model_loaded_once():
    """Verifies that model is loaded and contains 23 features and expected metadata."""
    forecaster = WorkloadForecaster()
    assert forecaster.is_loaded is True
    assert len(forecaster.features) == 23
    assert forecaster.target == "future_staff_workload"
    assert forecaster.forecast_horizon == "1 hour"
    assert forecaster.version == "v1"
    assert forecaster.model_name == "Gradient Boosting Regressor"


def test_predict_staff_workload_service(sample_workload_payload):
    """Direct service invocation test verifying clamping, percentage, and level."""
    res = predict_staff_workload(sample_workload_payload)

    assert res["forecast_horizon"] == "1 hour"
    assert res["model"] == "Gradient Boosting Regressor"
    assert res["version"] == "v1"
    assert "predicted_staff_workload" in res
    assert "workload_percentage" in res
    assert "workload_level" in res

    workload = res["predicted_staff_workload"]
    percentage = res["workload_percentage"]
    level = res["workload_level"]

    assert isinstance(workload, float)
    assert 0.0 <= workload <= 1.0
    assert isinstance(percentage, int)
    assert 0 <= percentage <= 100
    assert level in ["LOW", "MODERATE", "HIGH", "CRITICAL"]


def test_forecast_workload_api_endpoint(sample_workload_payload):
    """TEST REQUIREMENT 10:

    Sends valid sample payload to POST /api/forecast/workload and verifies:
    - HTTP 200
    - predicted_staff_workload exists
    - workload_percentage exists
    - workload_level exists
    - prediction is between 0 and 1
    - percentage is between 0 and 100
    """
    response = client.post("/api/forecast/workload", json=sample_workload_payload)
    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}: {response.text}"

    body = response.json()
    assert body["forecast_horizon"] == "1 hour"
    assert body["model"] == "Gradient Boosting Regressor"
    assert body["version"] == "v1"

    assert "predicted_staff_workload" in body
    assert "workload_percentage" in body
    assert "workload_level" in body

    workload = body["predicted_staff_workload"]
    percentage = body["workload_percentage"]
    level = body["workload_level"]

    assert isinstance(workload, float)
    assert 0.0 <= workload <= 1.0
    assert isinstance(percentage, int)
    assert 0 <= percentage <= 100
    assert level in ["LOW", "MODERATE", "HIGH", "CRITICAL"]


def test_workload_operational_levels():
    """Verifies operational workload thresholds:

    < 0.50 -> LOW
    0.50-0.74 -> MODERATE
    0.75-0.89 -> HIGH
    >= 0.90 -> CRITICAL
    """
    assert WorkloadForecaster.determine_workload_level(0.40) == "LOW"
    assert WorkloadForecaster.determine_workload_level(0.49) == "LOW"
    assert WorkloadForecaster.determine_workload_level(0.50) == "MODERATE"
    assert WorkloadForecaster.determine_workload_level(0.74) == "MODERATE"
    assert WorkloadForecaster.determine_workload_level(0.75) == "HIGH"
    assert WorkloadForecaster.determine_workload_level(0.89) == "HIGH"
    assert WorkloadForecaster.determine_workload_level(0.90) == "CRITICAL"
    assert WorkloadForecaster.determine_workload_level(0.98) == "CRITICAL"


def test_api_missing_features(sample_workload_payload):
    """Verifies that missing features return HTTP 422 with clear error message."""
    bad_payload = dict(sample_workload_payload)
    del bad_payload["staff_workload"]

    response = client.post("/api/forecast/workload", json=bad_payload)
    assert response.status_code == 422
    assert "Missing required features" in response.json()["detail"]


def test_api_invalid_feature_value(sample_workload_payload):
    """Verifies that invalid or out-of-range feature values return HTTP 422."""
    bad_payload = dict(sample_workload_payload, hour=25)
    response = client.post("/api/forecast/workload", json=bad_payload)
    assert response.status_code == 422
    assert "Invalid 'hour'" in response.json()["detail"]


def test_model_load_failure():
    """Verifies clean error handling on missing model artifact."""
    bad_forecaster = WorkloadForecaster(model_path="/nonexistent/model.pkl")
    assert bad_forecaster.is_loaded is False

    with pytest.raises(ModelLoadError, match="Model artifact not found"):
        bad_forecaster.predict({})
