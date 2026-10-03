"""Flow OS Operational Bottleneck Forecaster Service.

Integrates the trained RandomForestClassifier model (flowos_bottleneck_forecaster_v2.pkl)
to forecast hospital department bottlenecks (BED, CT, ER, ICU, MRI, STAFF, or NONE)
1 hour into the future based on real-time operational telemetry.
"""

import os
import math
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Union
import joblib
import pandas as pd

logger = logging.getLogger(__name__)


class BottleneckForecasterError(Exception):
    """Base exception for bottleneck forecaster errors."""
    pass


class ModelLoadError(BottleneckForecasterError):
    """Raised when the bottleneck forecaster ML model fails to load."""
    pass


class FeatureValidationError(BottleneckForecasterError, ValueError):
    """Raised when input state features are missing, non-numeric, or out of valid bounds."""
    pass


class BottleneckForecaster:
    """Modular forecaster that loads flowos_bottleneck_forecaster_v2.pkl once

    and performs validated inference.
    """

    def __init__(self, model_path: Optional[Union[str, Path]] = None):
        self.model_path = Path(model_path) if model_path else self._resolve_default_model_path()
        self.model = None
        self.features: List[str] = []
        self.classes: List[str] = []
        self.threshold: float = 0.24
        self.forecast_horizon: str = "1 hour"
        self.model_version: str = "v2.0"
        self.is_loaded: bool = False
        self._load_error: Optional[str] = None

        self._load_model()

    @staticmethod
    def _resolve_default_model_path() -> Path:
        """Resolves the default path to flowos_bottleneck_forecaster_v2.pkl."""
        # 1. Environment variable override
        env_path = os.getenv("FLOWOS_BOTTLENECK_MODEL_PATH")
        if env_path:
            return Path(env_path).resolve()

        # 2. Relative to this service file (backend/services/bottleneck_forecaster.py -> backend/models/...)
        base_dir = Path(__file__).resolve().parent.parent
        model_file = base_dir / "models" / "flowos_bottleneck_forecaster_v2.pkl"
        if model_file.exists():
            return model_file

        # 3. Fallback for root execution directory
        fallback_file = Path("backend/models/flowos_bottleneck_forecaster_v2.pkl").resolve()
        return fallback_file

    def _load_model(self) -> None:
        """Loads the pickled model bundle once at startup."""
        if not self.model_path.exists():
            self._load_error = f"Model artifact not found at: {self.model_path}"
            logger.error(self._load_error)
            return

        try:
            bundle = joblib.load(self.model_path)
            if not isinstance(bundle, dict):
                raise ValueError("Model pickle is not a valid bundle dictionary.")

            self.model = bundle["model"]
            self.features = list(bundle.get("features", []))
            self.classes = list(bundle.get("classes", []))
            self.threshold = float(bundle.get("threshold", 0.24))
            self.forecast_horizon = str(bundle.get("forecast_horizon", "1 hour"))
            self.model_version = str(bundle.get("version", "v2.0"))
            self.is_loaded = True
            self._load_error = None
            logger.info(
                "Successfully loaded Flow OS Bottleneck Forecaster %s (features=%d, threshold=%.2f, horizon=%s)",
                self.model_version,
                len(self.features),
                self.threshold,
                self.forecast_horizon,
            )
        except Exception as exc:
            self._load_error = f"Failed to load bottleneck forecaster model: {str(exc)}"
            logger.exception(self._load_error)
            self.model = None
            self.is_loaded = False

    def validate_state(self, state: Dict[str, Any]) -> Dict[str, float]:
        """Validates all 27 required model features for existence, numeric type,

        and valid operational boundaries.
        Returns a sanitized dictionary with float values.
        """
        if not isinstance(state, dict):
            raise FeatureValidationError(f"Expected input 'state' to be a dict, got {type(state).__name__}")

        if not self.is_loaded or self.model is None:
            raise ModelLoadError(self._load_error or "Bottleneck forecaster model is not loaded.")

        # 1. Check for missing features
        missing_features = [f for f in self.features if f not in state]
        if missing_features:
            raise FeatureValidationError(f"Missing required features ({len(missing_features)}): {missing_features}")

        cleaned_data: Dict[str, float] = {}

        # 2. Validate types and ranges
        ratio_features = {
            "bed_occupancy",
            "icu_occupancy",
            "ct_utilization",
            "mri_utilization",
            "equipment_utilization",
            "staff_workload",
        }

        non_negative_features = {
            "available_beds",
            "available_icu_beds",
            "er_arrivals",
            "admissions",
            "discharges",
            "er_queue",
            "ct_queue",
            "mri_queue",
            "avg_diagnostic_wait",
            "active_emergencies",
            "avg_transfer_time",
            "pending_tasks",
            "ct_pressure",
            "mri_pressure",
            "er_pressure",
            "icu_pressure",
            "bed_pressure",
            "staff_pressure",
        }

        for feat in self.features:
            raw_val = state[feat]

            if raw_val is None:
                raise FeatureValidationError(f"Feature '{feat}' cannot be None.")

            # Reject booleans for non-boolean fields to prevent True == 1 silently where inappropriate
            if isinstance(raw_val, bool) and feat != "is_weekend":
                raise FeatureValidationError(f"Feature '{feat}' must be numeric, got boolean: {raw_val}")

            try:
                val = float(raw_val)
            except (ValueError, TypeError):
                raise FeatureValidationError(
                    f"Feature '{feat}' must be numeric, got {type(raw_val).__name__}: {raw_val!r}"
                )

            if math.isnan(val) or math.isinf(val):
                raise FeatureValidationError(f"Feature '{feat}' cannot be NaN or Infinite.")

            # Range checks
            if feat == "hour":
                if not (0 <= val <= 23):
                    raise FeatureValidationError(f"Invalid 'hour': {val}. Must be between 0 and 23.")
            elif feat == "day_of_week":
                if not (0 <= val <= 6):
                    raise FeatureValidationError(f"Invalid 'day_of_week': {val}. Must be between 0 and 6.")
            elif feat == "is_weekend":
                if val not in (0.0, 1.0):
                    raise FeatureValidationError(f"Invalid 'is_weekend': {raw_val}. Must be 0 or 1.")
            elif feat in ratio_features:
                if not (0.0 <= val <= 1.0):
                    raise FeatureValidationError(f"Invalid '{feat}': {val}. Must be a ratio between 0.0 and 1.0.")
            elif feat in non_negative_features:
                if val < 0:
                    raise FeatureValidationError(f"Invalid '{feat}': {val}. Must be non-negative (>= 0).")

            cleaned_data[feat] = val

        return cleaned_data

    def predict(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Performs validated bottleneck forecast on the input operational state."""
        if not self.is_loaded or self.model is None:
            raise ModelLoadError(self._load_error or "Bottleneck forecaster model is not loaded.")

        # Validate input features
        cleaned = self.validate_state(state)

        # Create pandas DataFrame containing exactly the stored feature order
        df = pd.DataFrame([cleaned])[self.features]

        # Call model.predict_proba()
        proba_matrix = self.model.predict_proba(df)
        probas = proba_matrix[0]

        # Map classes to rounded probabilities (4 decimal places)
        probabilities: Dict[str, float] = {}
        for cls_name, p in zip(self.classes, probas):
            probabilities[str(cls_name)] = round(float(p), 4)

        # Ignore NONE when finding the highest bottleneck probability
        non_none_probs = {cls_name: prob for cls_name, prob in probabilities.items() if cls_name != "NONE"}

        if not non_none_probs:
            best_bottleneck = "NONE"
            highest_prob = 0.0
        else:
            best_bottleneck = max(non_none_probs, key=non_none_probs.get)
            highest_prob = non_none_probs[best_bottleneck]

        # Apply the stored threshold of 0.24:
        # If the highest bottleneck probability >= threshold: return that bottleneck. Otherwise: return NONE.
        if highest_prob >= self.threshold:
            prediction = best_bottleneck
            confidence = highest_prob
        else:
            prediction = "NONE"
            confidence = probabilities.get("NONE", 0.0)

        return {
            "prediction": prediction,
            "confidence": confidence,
            "threshold": self.threshold,
            "forecast_horizon": self.forecast_horizon,
            "probabilities": probabilities,
        }


# Singleton forecaster instance - loaded once on module import
_forecaster = BottleneckForecaster()


def predict_bottleneck(state: Dict[str, Any]) -> Dict[str, Any]:
    """Predicts operational bottleneck for the next 1 hour from hospital operational state.

    Args:
        state: Dictionary containing the 27 required operational features.

    Returns:
        Dictionary matching the Flow OS forecast schema:
        {
            "prediction": "ICU",
            "confidence": 0.7443,
            "threshold": 0.24,
            "forecast_horizon": "1 hour",
            "probabilities": {
                "BED": 0.0568,
                "CT": 0.0026,
                "ER": 0.0033,
                "ICU": 0.7443,
                "MRI": 0.0000,
                "NONE": 0.1879,
                "STAFF": 0.0051
            }
        }
    """
    return _forecaster.predict(state)
