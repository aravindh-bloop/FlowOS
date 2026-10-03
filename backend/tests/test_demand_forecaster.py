"""Tests for Flow OS Operational Demand Forecaster Service & API Endpoint."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from services.demand_forecaster import (
    DemandForecaster,
    predict_demand,
    FeatureValidationError,
    ModelLoadError,
)

client = TestClient(app)


@pytest.fixture
def sample_demand_payload():
    """Exact sample payload from user specification."""
    return {
        "hour": 14,
        "day_of_week": 2,
        "is_weekend": 0,
        "er_arrivals": 10,
        "admissions": 6,
        "discharges": 5,
        "ct_demand": 6,
        "mri_demand": 3,
        "bed_demand": 19,
        "icu_demand": 4,

        "er_arrivals_lag1": 10,
        "er_arrivals_lag24": 11,
        "er_arrivals_lag168": 9,
        "er_arrivals_rolling24": 10.2,

        "admissions_lag1": 6,
        "admissions_lag24": 7,
        "admissions_lag168": 6,
        "admissions_rolling24": 6.5,

        "discharges_lag1": 5,
        "discharges_lag24": 6,
        "discharges_lag168": 6,
        "discharges_rolling24": 6.1,

        "ct_demand_lag1": 6,
        "ct_demand_lag24": 5,
        "ct_demand_lag168": 5,
        "ct_demand_rolling24": 5.4,

        "mri_demand_lag1": 3,
        "mri_demand_lag24": 4,
        "mri_demand_lag168": 3,
        "mri_demand_rolling24": 3.5,

        "bed_demand_lag1": 19,
        "bed_demand_lag24": 18,
        "bed_demand_lag168": 20,
        "bed_demand_rolling24": 19.1,

        "icu_demand_lag1": 4,
        "icu_demand_lag24": 4,
        "icu_demand_lag168": 4,
        "icu_demand_rolling24": 4.2,
    }


def test_model_loaded_once():
    """Verifies that model is loaded and contains 38 features and 7 targets."""
    forecaster = DemandForecaster()
    assert forecaster.is_loaded is True
    assert len(forecaster.features) == 38
    assert len(forecaster.targets) == 7
    assert forecaster.forecast_horizon == "1 hour"
    assert forecaster.version == "v1"
    assert forecaster.model_name == "Gradient Boosting Multi-Output Regressor"


def test_predict_demand_service(sample_demand_payload):
    """Direct service invocation test verifying non-negative integer predictions."""
    res = predict_demand(sample_demand_payload)

    assert res["forecast_horizon"] == "1 hour"
    assert res["model"] == "Gradient Boosting Multi-Output Regressor"
    assert res["version"] == "v1"
    assert "predictions" in res

    preds = res["predictions"]
    expected_targets = [
        "future_er_arrivals",
        "future_admissions",
        "future_discharges",
        "future_ct_demand",
        "future_mri_demand",
        "future_bed_demand",
        "future_icu_demand",
    ]
    for target in expected_targets:
        assert target in preds
        val = preds[target]
        assert isinstance(val, int)
        assert val >= 0


def test_forecast_demand_api_endpoint(sample_demand_payload):
    """TEST REQUIREMENT 10:

    Sends the sample payload to POST /api/forecast/demand and verifies:
    - HTTP 200
    - all 7 prediction keys exist
    - predictions are numeric
    - predictions are non-negative
    """
    response = client.post("/api/forecast/demand", json=sample_demand_payload)
    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}: {response.text}"

    body = response.json()
    assert body["forecast_horizon"] == "1 hour"
    assert body["model"] == "Gradient Boosting Multi-Output Regressor"
    assert body["version"] == "v1"
    assert "predictions" in body

    predictions = body["predictions"]
    expected_targets = [
        "future_er_arrivals",
        "future_admissions",
        "future_discharges",
        "future_ct_demand",
        "future_mri_demand",
        "future_bed_demand",
        "future_icu_demand",
    ]

    for target in expected_targets:
        assert target in predictions, f"Missing prediction target: {target}"
        val = predictions[target]
        assert isinstance(val, (int, float)), f"Expected numeric prediction for {target}, got {type(val)}"
        assert val >= 0, f"Expected non-negative prediction for {target}, got {val}"


def test_api_missing_features(sample_demand_payload):
    """Verifies that missing features return HTTP 422 with clear error message."""
    bad_payload = dict(sample_demand_payload)
    del bad_payload["icu_demand"]

    response = client.post("/api/forecast/demand", json=bad_payload)
    assert response.status_code == 422
    assert "Missing required features" in response.json()["detail"]


def test_api_invalid_feature_value(sample_demand_payload):
    """Verifies that invalid or negative feature values return HTTP 422."""
    bad_payload = dict(sample_demand_payload, hour=99)
    response = client.post("/api/forecast/demand", json=bad_payload)
    assert response.status_code == 422
    assert "Invalid 'hour'" in response.json()["detail"]


def test_model_load_failure():
    """Verifies clean error handling on missing model artifact."""
    bad_forecaster = DemandForecaster(model_path="/nonexistent/model.pkl")
    assert bad_forecaster.is_loaded is False

    with pytest.raises(ModelLoadError, match="Model artifact not found"):
        bad_forecaster.predict({})
