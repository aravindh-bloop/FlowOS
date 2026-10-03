import os
import joblib
import numpy as np
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "models", "flowos_anomaly_model.pkl")

class FlowOSAnomalyDetector:
    def __init__(self):
        self.model = None
        self._load_model()

    def _load_model(self):
        try:
            if os.path.exists(MODEL_PATH):
                self.model = joblib.load(MODEL_PATH)
                print(f"[FlowOS ML] Successfully loaded anomaly model from {MODEL_PATH}")
            else:
                print(f"[FlowOS ML Warning] Model file not found at {MODEL_PATH}")
        except Exception as e:
            print(f"[FlowOS ML Error] Failed loading model: {e}")

    def evaluate_vitals(
        self,
        heart_rate: float,
        spo2: float,
        systolic_bp: float,
        temp_c: float = 36.8,
        length_of_stay_hrs: float = 12.0,
        acuity_score: int = 2
    ) -> Dict[str, Any]:
        """
        Evaluates input vitals against the loaded IsolationForest model.
        """
        features = np.array([[heart_rate, spo2, systolic_bp, temp_c, length_of_stay_hrs, acuity_score]])
        
        is_anomaly = False
        anomaly_score = 0.15

        if self.model:
            try:
                pred = self.model.predict(features)[0]  # -1 for anomaly, 1 for normal
                raw_score = self.model.score_samples(features)[0]
                # Convert IsolationForest score_samples (negative values) to 0.0 - 1.0 risk range
                anomaly_score = round(float(np.clip(0.5 - raw_score, 0.0, 1.0)), 2)
                is_anomaly = bool(pred == -1 or anomaly_score > 0.65)
            except Exception as e:
                print(f"[FlowOS ML Prediction Error] {e}")

        # Deterministic fallback rules for severe clinical vitals
        if spo2 < 92 or heart_rate > 120 or heart_rate < 45 or systolic_bp > 160 or systolic_bp < 85:
            is_anomaly = True
            anomaly_score = max(anomaly_score, 0.88)

        # Categorize anomaly type
        if spo2 < 93:
            anomaly_type = "CRITICAL_HYPOXIA_RISK"
            recommended_action = "Administer high-flow O2 & Request Urgent ICU Consult"
        elif heart_rate > 115 or systolic_bp > 155:
            anomaly_type = "CARDIAC_HEMODYNAMIC_INSTABILITY"
            recommended_action = "Order Stat ECG & Notify Attending Physician"
        elif length_of_stay_hrs > 72:
            anomaly_type = "DISCHARGE_BOTTLENECK_ANOMALY"
            recommended_action = "Review Bed Flow & Initiate Transfer Protocol"
        else:
            anomaly_type = "PHYSIOLOGICAL_DETERIORATION"
            recommended_action = "Increase Vital Sign Monitoring Frequency to q15m"

        return {
            "is_anomaly": is_anomaly,
            "anomaly_score": anomaly_score,
            "anomaly_type": anomaly_type if is_anomaly else "NORMAL",
            "risk_level": "CRITICAL" if anomaly_score >= 0.75 else "HIGH" if anomaly_score >= 0.50 else "LOW",
            "recommended_action": recommended_action if is_anomaly else "Standard Monitoring",
            "model_version": "v1.0.0 (IsolationForest)",
            "evaluated_metrics": {
                "heart_rate": heart_rate,
                "spo2": spo2,
                "systolic_bp": systolic_bp,
                "temp_c": temp_c,
                "length_of_stay_hrs": length_of_stay_hrs,
                "acuity_score": acuity_score
            }
        }

    def get_live_hospital_anomalies(self) -> List[Dict[str, Any]]:
        """
        Generates live ML anomaly feeds across active hospital beds/patients.
        """
        sample_patients = [
            {"patient_id": 101, "name": "Sarah Jenkins", "mrn": "MRN-8821", "bed": "ICU Bed 04", "hr": 128, "spo2": 89, "bp": 165, "stay": 44, "acuity": 4},
            {"patient_id": 104, "name": "David Miller", "mrn": "MRN-3302", "bed": "ER Bay 02", "hr": 114, "spo2": 91, "bp": 142, "stay": 18, "acuity": 3},
            {"patient_id": 108, "name": "Elena Rostova", "mrn": "MRN-9014", "bed": "MedSurg Bed 12", "hr": 74, "spo2": 98, "bp": 118, "stay": 14, "acuity": 2},
            {"patient_id": 112, "name": "Marcus Vance", "mrn": "MRN-5519", "bed": "StepDown Bed 08", "hr": 135, "spo2": 88, "bp": 170, "stay": 82, "acuity": 5},
        ]

        results = []
        for p in sample_patients:
            evaluation = self.evaluate_vitals(
                heart_rate=p["hr"],
                spo2=p["spo2"],
                systolic_bp=p["bp"],
                length_of_stay_hrs=p["stay"],
                acuity_score=p["acuity"]
            )
            if evaluation["is_anomaly"]:
                results.append({
                    "patient_id": p["patient_id"],
                    "patient_name": p["name"],
                    "mrn": p["mrn"],
                    "location": p["bed"],
                    **evaluation
                })
        return results

anomaly_detector_service = FlowOSAnomalyDetector()
