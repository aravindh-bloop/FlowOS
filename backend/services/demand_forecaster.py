"""Flow OS Operational Demand Forecaster Service.

Integrates the trained MultiOutputRegressor model (flowos_demand_forecaster_v1.pkl)
to forecast 1-hour ahead departmental demand metrics:
- future_er_arrivals
- future_admissions
- future_discharges
- future_ct_demand
- future_mri_demand
- future_bed_demand
- future_icu_demand
"""

import os
import math
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Union
import joblib
import pandas as pd

logger = logging.getLogger(__name__)


class DemandForecasterError(Exception):
    """Base exception for demand forecaster errors."""
    pass


class ModelLoadError(DemandForecasterError):
    """Raised when the demand forecaster model file is missing or fails to load."""
    pass


class FeatureValidationError(DemandForecasterError, ValueError):
    """Raised when input features are missing, non-numeric, or outside valid ranges."""
    pass


class PredictionError(DemandForecasterError):
    """Raised when model inference execution fails."""
    pass


class DemandForecaster:
    """Modular forecaster service that loads flowos_demand_forecaster_v1.pkl once

    and executes validated multi-target demand forecasting.
    """

    def __init__(self, model_path: Optional[Union[str, Path]] = None):
        self.model_path = Path(model_path) if model_path else self._resolve_default_model_path()
        self.model = None
        self.features: List[str] = []
        self.targets: List[str] = []
        self.forecast_horizon: str = "1 hour"
        self.model_name: str = "Gradient Boosting Multi-Output Regressor"
        self.version: str = "v1"
        self.is_loaded: bool = False
        self._load_error: Optional[str] = None

        self._load_model()

    @staticmethod
    def _resolve_default_model_path() -> Path:
        """Resolves the default path to flowos_demand_forecaster_v1.pkl."""
        # 1. Environment variable override
        env_path = os.getenv("FLOWOS_DEMAND_MODEL_PATH")
        if env_path:
            return Path(env_path).resolve()

        # 2. Relative to this service file (backend/services/demand_forecaster.py -> backend/models/...)
        base_dir = Path(__file__).resolve().parent.parent
        model_file = base_dir / "models" / "flowos_demand_forecaster_v1.pkl"
        if model_file.exists():
            return model_file

        # 3. Fallback for root execution directory
        fallback_file = Path("backend/models/flowos_demand_forecaster_v1.pkl").resolve()
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
            # Dynamically read features and targets from serialized model package (no hardcoding)
            self.features = list(bundle.get("features", []))
            self.targets = list(bundle.get("targets", []))
            self.forecast_horizon = str(bundle.get("forecast_horizon", "1 hour"))
            self.model_name = str(bundle.get("model_name", "Gradient Boosting Multi-Output Regressor"))
            self.version = str(bundle.get("version", "v1"))
            self.is_loaded = True
            self._load_error = None
            logger.info(
                "Successfully loaded Flow OS Demand Forecaster %s (%s, features=%d, targets=%d, horizon=%s)",
                self.version,
                self.model_name,
                len(self.features),
                len(self.targets),
                self.forecast_horizon,
            )
        except Exception as exc:
            self._load_error = f"Failed to load demand forecaster model: {str(exc)}"
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
            raise ModelLoadError(self._load_error or "Demand forecaster model is not loaded.")

        # Check for missing features against serialized feature list
        missing_features = [f for f in self.features if f not in state]
        if missing_features:
            raise FeatureValidationError(f"Missing required features ({len(missing_features)}): {missing_features}")

        cleaned_data: Dict[str, float] = {}

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
            else:
                # All demand and volume counters/lags/rollings must be non-negative
                if val < 0:
                    raise FeatureValidationError(f"Invalid '{feat}': {val}. Demand metric must be non-negative (>= 0).")

            cleaned_data[feat] = val

        return cleaned_data

    def predict(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Runs demand forecasting inference and maps targets to non-negative rounded integers."""
        if not self.is_loaded or self.model is None:
            raise ModelLoadError(self._load_error or "Demand forecaster model is not loaded.")

        # Validate input features
        cleaned = self.validate_state(state)

        # Construct pandas DataFrame with exactly the stored feature order
        df = pd.DataFrame([cleaned])[self.features]

        # Execute model prediction
        try:
            raw_predictions = self.model.predict(df)[0]
        except Exception as exc:
            raise PredictionError(f"Prediction inference failed: {str(exc)}") from exc

        # Map predictions to targets, round to integer, and prevent negative predictions
        predictions: Dict[str, int] = {}
        for target_name, pred_val in zip(self.targets, raw_predictions):
            predictions[str(target_name)] = max(0, int(round(float(pred_val))))

        return {
            "forecast_horizon": self.forecast_horizon,
            "model": self.model_name,
            "version": self.version,
            "predictions": predictions,
        }


# Singleton service instance - loaded once on module import
demand_forecaster = DemandForecaster()


def predict_demand(state: Dict[str, Any]) -> Dict[str, Any]:
    """Forecasts departmental operational demand 1 hour into the future.

    Args:
        state: Dictionary containing the 38 required operational features.

    Returns:
        JSON-serializable dictionary with forecast metadata and 7 non-negative target counts:
        {
            "forecast_horizon": "1 hour",
            "model": "Gradient Boosting Multi-Output Regressor",
            "version": "v1",
            "predictions": {
                "future_er_arrivals": 0,
                "future_admissions": 0,
                "future_discharges": 0,
                "future_ct_demand": 0,
                "future_mri_demand": 0,
                "future_bed_demand": 0,
                "future_icu_demand": 0
            }
        }
    """
    return demand_forecaster.predict(state)
