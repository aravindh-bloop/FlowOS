"""FastAPI router for Flow OS operational forecasting endpoints."""

from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any
from pydantic import BaseModel
from services.demand_forecaster import (
    predict_demand,
    DemandForecasterError,
    ModelLoadError,
    FeatureValidationError,
    PredictionError,
    demand_forecaster,
)

router = APIRouter(prefix="/api/forecast", tags=["Demand Forecasting ML"])


class DemandPredictions(BaseModel):
    future_er_arrivals: int
    future_admissions: int
    future_discharges: int
    future_ct_demand: int
    future_mri_demand: int
    future_bed_demand: int
    future_icu_demand: int


class DemandForecastResponse(BaseModel):
    forecast_horizon: str
    model: str
    version: str
    predictions: DemandPredictions


@router.get("/metadata")
def get_demand_forecaster_metadata():
    """Returns metadata for the demand forecasting model including loaded features and targets."""
    return {
        "model_name": demand_forecaster.model_name,
        "version": demand_forecaster.version,
        "forecast_horizon": demand_forecaster.forecast_horizon,
        "features_count": len(demand_forecaster.features),
        "features": demand_forecaster.features,
        "targets": demand_forecaster.targets,
        "is_loaded": demand_forecaster.is_loaded,
    }


@router.post("/demand", response_model=DemandForecastResponse)
def forecast_demand(payload: Dict[str, Any]):
    """Forecasts departmental operational demand 1 hour into the future based on 38 telemetry features.

    Validates that all model features exist and returns non-negative rounded count predictions.
    """
    try:
        result = predict_demand(payload)
        return result
    except FeatureValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except ModelLoadError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except PredictionError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
    except DemandForecasterError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected forecasting failure: {str(exc)}",
        ) from exc
