"""Flow OS Operational Staff Workload Forecaster Service.

Integrates the trained GradientBoostingRegressor model (flowos_workload_forecaster_v1.pkl)
to forecast 1-hour ahead hospital staff workload, workload percentage, and operational severity level:
- LOW (< 0.50)
- MODERATE (0.50 - 0.74)
- HIGH (0.75 - 0.89)
- CRITICAL (>= 0.90)
"""

import os
import math
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Union
import joblib
import pandas as pd

logger = logging.getLogger(__name__)


class WorkloadForecasterError(Exception):
    """Base exception for workload forecaster errors."""
    pass


class ModelLoadError(WorkloadForecasterError):
    """Raised when the workload forecaster model file is missing or fails to load."""
    pass


class FeatureValidationError(WorkloadForecasterError, ValueError):
    """Raised when input features are missing, non-numeric, or outside valid ranges."""
    pass


class PredictionError(WorkloadForecasterError):
    """Raised when model inference execution fails."""
    pass


class WorkloadForecaster:
    """Modular service that loads flowos_workload_forecaster_v1.pkl once

    and executes validated staff workload forecasting.
    """

    def __init__(self, model_path: Optional[Union[str, Path]] = None):
        self.model_path = Path(model_path) if model_path else self._resolve_default_model_path()
        self.model = None
        self.features: List[str] = []
        self.target: str = "future_staff_workload"
        self.forecast_horizon: str = "1 hour"
        self.model_name: str = "Gradient Boosting Regressor"
        self.version: str = "v1"
        self.is_loaded: bool = False
        self._load_error: Optional[str] = None

        self._load_model()

    @staticmethod
    def _resolve_default_model_path() -> Path:
        """Resolves the default path to flowos_workload_forecaster_v1.pkl."""
        # 1. Environment variable override
        env_path = os.getenv("FLOWOS_WORKLOAD_MODEL_PATH")
        if env_path:
            return Path(env_path).resolve()

        # 2. Relative to this service file (backend/services/workload_forecaster.py -> backend/models/...)
        base_dir = Path(__file__).resolve().parent.parent
        model_file = base_dir / "models" / "flowos_workload_forecaster_v1.pkl"
        if model_file.exists():
            return model_file

        # 3. Fallback for root execution directory
        fallback_file = Path("backend/models/flowos_workload_forecaster_v1.pkl").resolve()
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
            # Dynamically read features from serialized model package (no hardcoding)
            self.features = list(bundle.get("features", []))
            self.target = str(bundle.get("target", "future_staff_workload"))
            self.forecast_horizon = str(bundle.get("forecast_horizon", "1 hour"))
            self.model_name = str(bundle.get("model_name", "Gradient Boosting Regressor"))
            self.version = str(bundle.get("version", "v1"))
            self.is_loaded = True
            self._load_error = None
            logger.info(
                "Successfully loaded Flow OS Workload Forecaster %s (%s, features=%d, target=%s, horizon=%s)",
                self.version,
                self.model_name,
                len(self.features),
                self.target,
                self.forecast_horizon,
            )
        except Exception as exc:
            self._load_error = f"Failed to load workload forecaster model: {str(exc)}"
            logger.exception(self._load_error)
            self.model = None
            self.is_loaded = False

    def validate_state(self, state: Dict[str, Any]) -> Dict[str, float]:
        """Validates that all required features exist, are numeric, and fall within

        valid operational bounds.
        """
        if not isinstance(state, dict):
            raise FeatureValidationError(f"Expected input 'state' to be a dict, got {type(state).__name__}")

        if not self.is_loaded or self.model is None:
            raise ModelLoadError(self._load_error or "Workload forecaster model is not loaded.")

        # Check for missing features against serialized feature list
        missing_features = [f for f in self.features if f not in state]
        if missing_features:
            raise FeatureValidationError(f"Missing required features ({len(missing_features)}): {missing_features}")

        cleaned_data: Dict[str, float] = {}

        ratio_features = {
            "icu_occupancy",
            "staff_workload",
            "staff_workload_lag1",
            "staff_workload_lag24",
            "staff_workload_lag168",
            "staff_workload_rolling24",
        }

        for feat in self.features:
            raw_val = state[feat]

            if raw_val is None:
                raise FeatureValidationError(f"Feature '{feat}' cannot be None.")

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

            # Bounds validation
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
                    raise FeatureValidationError(f"Invalid '{feat}': {val}. Ratio must be between 0.0 and 1.0.")
            else:
                # Counts, ratios, and pressures must be non-negative
                if val < 0:
                    raise FeatureValidationError(f"Invalid '{feat}': {val}. Metric must be non-negative (>= 0).")

            cleaned_data[feat] = val

        return cleaned_data

    @staticmethod
    def determine_workload_level(workload: float) -> str:
        """Determines operational workload level according to specification thresholds:

        < 0.50     -> LOW
        0.50-0.74  -> MODERATE
        0.75-0.89  -> HIGH
        >= 0.90    -> CRITICAL
        """
        if workload < 0.50:
            return "LOW"
        elif workload <= 0.74:
            return "MODERATE"
        elif workload <= 0.89:
            return "HIGH"
        else:
            return "CRITICAL"

    def predict(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Runs workload forecasting inference, clamps to [0, 1], computes integer percentage,

        and determines operational workload level.
        """
        if not self.is_loaded or self.model is None:
            raise ModelLoadError(self._load_error or "Workload forecaster model is not loaded.")

        # Validate input features
        cleaned = self.validate_state(state)

        # Construct pandas DataFrame using exactly the stored feature order
        df = pd.DataFrame([cleaned])[self.features]

        # Execute model prediction
        try:
            raw_prediction = float(self.model.predict(df)[0])
        except Exception as exc:
            raise PredictionError(f"Prediction inference failed: {str(exc)}") from exc

        # Clamp prediction to [0.0, 1.0]
        clamped_prediction = max(0.0, min(1.0, raw_prediction))

        # Convert to rounded workload and percentage
        predicted_staff_workload = round(clamped_prediction, 2)
        workload_percentage = int(round(clamped_prediction * 100))

        # Determine operational workload level
        workload_level = self.determine_workload_level(predicted_staff_workload)

        return {
            "forecast_horizon": self.forecast_horizon,
            "model": self.model_name,
            "version": self.version,
            "predicted_staff_workload": predicted_staff_workload,
            "workload_percentage": workload_percentage,
            "workload_level": workload_level,
        }


# Singleton service instance - loaded once on module import
workload_forecaster = WorkloadForecaster()


def predict_staff_workload(state: Dict[str, Any]) -> Dict[str, Any]:
    """Forecasts staff workload 1 hour into the future based on operational state.

    Args:
        state: Dictionary containing the 23 required operational features.

    Returns:
        JSON-serializable dictionary with forecast metadata, percentage, and level:
        {
            "forecast_horizon": "1 hour",
            "model": "Gradient Boosting Regressor",
            "version": "v1",
            "predicted_staff_workload": 0.73,
            "workload_percentage": 73,
            "workload_level": "MODERATE"
        }
    """
    return workload_forecaster.predict(state)
