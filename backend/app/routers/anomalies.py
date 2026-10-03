from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.services.anomaly_detection_service import anomaly_detector_service

router = APIRouter(prefix="/api/anomalies", tags=["Anomalies ML"])

class EvaluateVitalsRequest(BaseModel):
    patient_id: Optional[int] = None
    heart_rate: float
    spo2: float
    systolic_bp: float
    temp_c: Optional[float] = 36.8
    length_of_stay_hrs: Optional[float] = 12.0
    acuity_score: Optional[int] = 2

@router.get("/live")
def get_live_anomalies():
    """
    Returns live ML anomaly detections for hospital patients/beds.
    """
    return {
        "status": "success",
        "anomalies": anomaly_detector_service.get_live_hospital_anomalies()
    }

@router.post("/evaluate")
def evaluate_vitals(request: EvaluateVitalsRequest):
    """
    Evaluates vital signs against flowos_anomaly_model.pkl IsolationForest model.
    """
    result = anomaly_detector_service.evaluate_vitals(
        heart_rate=request.heart_rate,
        spo2=request.spo2,
        systolic_bp=request.systolic_bp,
        temp_c=request.temp_c or 36.8,
        length_of_stay_hrs=request.length_of_stay_hrs or 12.0,
        acuity_score=request.acuity_score or 2
    )
    return {
        "status": "success",
        "patient_id": request.patient_id,
        "evaluation": result
    }
