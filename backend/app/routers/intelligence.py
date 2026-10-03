from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Dict, Any, List
from app.intelligence.anomalydetection import hybrid_detector
from app.intelligence.waiting_time import waiting_time_predictor

router = APIRouter(prefix="/api/intelligence", tags=["Intelligence ML"])

class HospitalStateRequest(BaseModel):
    hour: int = Field(..., ge=0, le=23, description="Hour of the day (0-23)")
    day_of_week: int = Field(..., ge=0, le=6, description="Day of week (0=Monday, 6=Sunday)")
    is_weekend: int = Field(..., ge=0, le=1, description="1 if weekend else 0")
    er_arrivals: int = Field(..., ge=0, description="ER arrivals count")
    admissions: int = Field(..., ge=0, description="Hospital admissions count")
    discharges: int = Field(..., ge=0, description="Discharges count")
    er_queue: int = Field(..., ge=0, description="ER waiting queue size")
    bed_occupancy: float = Field(..., ge=0.0, le=1.0, description="Hospital bed occupancy ratio (0.0 to 1.0)")
    available_beds: int = Field(..., ge=0, description="Number of available general beds")
    icu_occupancy: float = Field(..., ge=0.0, le=1.0, description="ICU occupancy ratio (0.0 to 1.0)")
    available_icu_beds: int = Field(..., ge=0, description="Number of available ICU beds")
    ct_queue: int = Field(..., ge=0, description="CT scan waiting queue size")
    mri_queue: int = Field(..., ge=0, description="MRI scan waiting queue size")
    equipment_utilization: float = Field(..., ge=0.0, le=1.0, description="Medical equipment utilization ratio (0.0 to 1.0)")
    avg_diagnostic_wait: float = Field(..., ge=0.0, description="Average diagnostic wait time in minutes")
    staff_workload: float = Field(..., ge=0.0, le=1.0, description="Staff workload ratio (0.0 to 1.0)")
    active_emergencies: int = Field(..., ge=0, description="Number of active emergency alerts")
    avg_transfer_time: float = Field(..., ge=0.0, description="Average patient transfer time in minutes")
    pending_tasks: int = Field(..., ge=0, description="Pending operational tasks count")

class WaitingTimeRequest(BaseModel):
    hour: int = Field(..., ge=0, le=23, description="Hour of day (0–23)")
    day_of_week: int = Field(..., ge=0, le=6, description="Day of week (0=Monday, 6=Sunday)")
    is_weekend: int = Field(..., ge=0, le=1, description="1 if weekend else 0")
    procedure_type: str = Field(..., min_length=1, description="Procedure type, e.g. CT, MRI, XRAY, ULTRASOUND, LAB, SURGERY")
    patient_priority: str = Field(..., min_length=1, description="Patient priority, e.g. URGENT, NORMAL, HIGH, CRITICAL, LOW")
    er_arrivals: int = Field(..., ge=0, description="ER arrivals count")
    admissions: int = Field(..., ge=0, description="Hospital admissions count")
    discharges: int = Field(..., ge=0, description="Discharges count")
    er_queue: int = Field(..., ge=0, description="ER waiting queue size")
    bed_occupancy: float = Field(..., ge=0.0, le=1.0, description="Bed occupancy ratio (0.0 to 1.0)")
    available_beds: int = Field(..., ge=0, description="Available general beds")
    icu_occupancy: float = Field(..., ge=0.0, le=1.0, description="ICU occupancy ratio (0.0 to 1.0)")
    available_icu_beds: int = Field(..., ge=0, description="Available ICU beds")
    ct_queue: int = Field(..., ge=0, description="CT queue size")
    mri_queue: int = Field(..., ge=0, description="MRI queue size")
    equipment_utilization: float = Field(..., ge=0.0, le=1.0, description="Equipment utilization ratio (0.0 to 1.0)")
    staff_workload: float = Field(..., ge=0.0, le=1.0, description="Staff workload ratio (0.0 to 1.0)")
    active_emergencies: int = Field(..., ge=0, description="Active emergency alerts count")
    pending_tasks: int = Field(..., ge=0, description="Pending tasks count")
    historical_avg_processing_time: float = Field(..., ge=0.0, description="Historical average processing time in minutes")

class PredictionResult(BaseModel):
    model_config = {"protected_namespaces": ()}
    predicted_waiting_time_minutes: float
    model_version: str

class WaitingTimeResponse(BaseModel):
    success: bool
    prediction: PredictionResult

@router.post("/anomaly-detection")
def detect_hospital_anomalies(request: HospitalStateRequest):
    """
    Evaluates hospital operational state using hybrid ML pipeline and operational rules.
    """
    try:
        state_dict = request.model_dump()
        result = hybrid_detector.detect_anomalies(state_dict)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing anomaly detection: {str(e)}"
        )

@router.post("/waiting-time", response_model=WaitingTimeResponse)
def predict_waiting_time(request: WaitingTimeRequest):
    """
    Predicts actual patient/procedure waiting time in minutes using GradientBoosting ML pipeline.
    """
    try:
        state_dict = request.model_dump()
        result = waiting_time_predictor.predict(state_dict)
        return {
            "success": True,
            "prediction": result
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error predicting waiting time: {str(e)}"
        )
