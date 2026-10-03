"""Tests for Flow OS Operational Bottleneck Forecaster Service."""

import pytest
from services.bottleneck_forecaster import (
    BottleneckForecaster,
    predict_bottleneck,
    FeatureValidationError,
    ModelLoadError,
)


@pytest.fixture
def base_valid_state():
    """Generates a base valid dictionary containing all 27 operational features."""
    forecaster = BottleneckForecaster()
    state = {feat: 0.5 for feat in forecaster.features}
    state.update({
        "hour": 14,
        "day_of_week": 2,
        "is_weekend": 0,
        "er_arrivals": 10,
        "admissions": 5,
        "discharges": 4,
        "er_queue": 6,
        "bed_occupancy": 0.85,
        "available_beds": 15,
        "icu_occupancy": 0.80,
        "available_icu_beds": 3,
        "ct_queue": 4,
        "mri_queue": 2,
        "ct_utilization": 0.70,
        "mri_utilization": 0.65,
        "equipment_utilization": 0.75,
        "avg_diagnostic_wait": 25.0,
        "staff_workload": 0.80,
        "active_emergencies": 1,
        "avg_transfer_time": 18.0,
        "pending_tasks": 20,
        "ct_pressure": 12.0,
        "mri_pressure": 8.0,
        "er_pressure": 14.0,
        "icu_pressure": 16.0,
        "bed_pressure": 15.0,
        "staff_pressure": 18.0,
    })
    return state


def test_model_loaded_once():
    """Verifies that model is loaded and contains 27 features and threshold 0.24."""
    forecaster = BottleneckForecaster()
    assert forecaster.is_loaded is True
    assert forecaster.threshold == 0.24
    assert forecaster.forecast_horizon == "1 hour"
    assert len(forecaster.features) == 27
    assert set(forecaster.classes) == {"BED", "CT", "ER", "ICU", "MRI", "NONE", "STAFF"}


def test_predict_bottleneck_structure(base_valid_state):
    """Verifies response structure and schema matching prompt specification."""
    res = predict_bottleneck(base_valid_state)

    assert "prediction" in res
    assert "confidence" in res
    assert "threshold" in res
    assert res["threshold"] == 0.24
    assert res["forecast_horizon"] == "1 hour"
    assert "probabilities" in res

    probs = res["probabilities"]
    expected_classes = ["BED", "CT", "ER", "ICU", "MRI", "NONE", "STAFF"]
    for c in expected_classes:
        assert c in probs
        assert isinstance(probs[c], float)
        # Check rounding to 4 decimal places
        assert len(str(probs[c]).split(".")[-1]) <= 4

    assert res["prediction"] in expected_classes
    assert isinstance(res["confidence"], float)


def test_predict_bottleneck_high_stress(base_valid_state):
    """Verifies that under severe MRI pressure, MRI bottleneck is predicted."""
    stressed_state = dict(base_valid_state)
    stressed_state["mri_queue"] = 28
    stressed_state["mri_utilization"] = 0.99
    stressed_state["mri_pressure"] = 45.0

    res = predict_bottleneck(stressed_state)
    assert res["prediction"] == "MRI"
    assert res["confidence"] >= 0.24
    assert res["confidence"] == res["probabilities"]["MRI"]


def test_predict_bottleneck_below_threshold(base_valid_state):
    """Verifies that when highest non-NONE bottleneck < 0.24, prediction is NONE."""
    # Under low/even load, bottleneck should be NONE
    low_state = {k: 0.1 for k in base_valid_state.keys()}
    low_state.update({
        "hour": 10,
        "day_of_week": 1,
        "is_weekend": 0,
        "bed_occupancy": 0.40,
        "icu_occupancy": 0.40,
        "equipment_utilization": 0.30,
        "staff_workload": 0.30,
        "ct_utilization": 0.30,
        "mri_utilization": 0.30,
    })
    res = predict_bottleneck(low_state)
    non_none_probs = {c: p for c, p in res["probabilities"].items() if c != "NONE"}
    max_non_none = max(non_none_probs.values())

    if max_non_none < 0.24:
        assert res["prediction"] == "NONE"
        assert res["confidence"] == res["probabilities"]["NONE"]


def test_missing_features_validation(base_valid_state):
    """Verifies that missing features raise FeatureValidationError."""
    invalid_state = dict(base_valid_state)
    del invalid_state["hour"]
    del invalid_state["icu_occupancy"]

    with pytest.raises(FeatureValidationError) as exc_info:
        predict_bottleneck(invalid_state)

    assert "Missing required features" in str(exc_info.value)
    assert "hour" in str(exc_info.value)
    assert "icu_occupancy" in str(exc_info.value)


def test_invalid_feature_values(base_valid_state):
    """Verifies invalid numeric ranges, types, and NaN rejection."""
    # 1. Invalid hour (> 23)
    s1 = dict(base_valid_state, hour=25)
    with pytest.raises(FeatureValidationError, match="Invalid 'hour'"):
        predict_bottleneck(s1)

    # 2. Invalid ratio (> 1.0)
    s2 = dict(base_valid_state, bed_occupancy=1.5)
    with pytest.raises(FeatureValidationError, match="Invalid 'bed_occupancy'"):
        predict_bottleneck(s2)

    # 3. Negative queue (< 0)
    s3 = dict(base_valid_state, er_queue=-1)
    with pytest.raises(FeatureValidationError, match="Invalid 'er_queue'"):
        predict_bottleneck(s3)

    # 4. String feature
    s4 = dict(base_valid_state, ct_queue="invalid")
    with pytest.raises(FeatureValidationError, match="must be numeric"):
        predict_bottleneck(s4)

    # 5. None feature
    s5 = dict(base_valid_state, admissions=None)
    with pytest.raises(FeatureValidationError, match="cannot be None"):
        predict_bottleneck(s5)


def test_model_load_failure():
    """Verifies clean error handling on missing model artifact."""
    bad_forecaster = BottleneckForecaster(model_path="/nonexistent/model.pkl")
    assert bad_forecaster.is_loaded is False

    with pytest.raises(ModelLoadError, match="Model artifact not found"):
        bad_forecaster.predict({})
