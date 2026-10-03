import os
import joblib
import pandas as pd
from typing import Dict, Any, List

# Absolute or relative path to the trained model pkl file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(BASE_DIR, "backend", "models", "flowos_anomaly_model.pkl")

# Fallback path if running inside backend working directory
if not os.path.exists(MODEL_PATH):
    MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "flowos_anomaly_model.pkl")

# Severity Hierarchy Ranking
SEVERITY_RANK = {
    "NORMAL": 0,
    "LOW": 1,
    "MEDIUM": 2,
    "HIGH": 3,
    "CRITICAL": 4
}

class HybridAnomalyDetector:
    def __init__(self, model_path: str = MODEL_PATH):
        self.model_path = model_path
        self.pipeline = None
        self.features = []
        self.ml_threshold = 0.0
        self.model_version = "1.0.0"
        self._load_model_bundle()

    def _load_model_bundle(self):
        try:
            if os.path.exists(self.model_path):
                bundle = joblib.load(self.model_path)
                if isinstance(bundle, dict):
                    self.pipeline = bundle.get("pipeline")
                    self.features = bundle.get("features", [])
                    self.ml_threshold = float(bundle.get("ml_threshold", 0.0))
                    self.model_version = str(bundle.get("model_version", "1.0.0"))
                    print(f"[FlowOS Intelligence] Loaded model bundle v{self.model_version} from {self.model_path}")
                else:
                    self.pipeline = bundle
                    print(f"[FlowOS Intelligence] Loaded standalone pipeline from {self.model_path}")
            else:
                print(f"[FlowOS Intelligence Warning] Model file missing at {self.model_path}")
        except Exception as e:
            print(f"[FlowOS Intelligence Error] Failed to load anomaly model: {e}")

    def detect_anomalies(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes hybrid ML & operational rule anomaly detection on hospital state.
        """
        # 1. ML Detection
        ml_anomaly = False
        ml_score = 0.0

        if self.pipeline is not None and self.features:
            try:
                # Prepare single-row DataFrame using required features
                input_df = pd.DataFrame([state])
                input_features = input_df[self.features]
                
                # Calculate decision function score
                ml_score = float(self.pipeline.decision_function(input_features)[0])
                ml_anomaly = bool(ml_score < self.ml_threshold)
            except Exception as e:
                print(f"[FlowOS Intelligence Prediction Error] {e}")

        # 2. Operational Rule Layer
        operational_anomalies = []

        # Rule 1: ICU Pressure
        icu_occupancy = float(state.get("icu_occupancy", 0.0))
        available_icu_beds = int(state.get("available_icu_beds", 0))
        if icu_occupancy >= 0.995 and available_icu_beds == 0:
            operational_anomalies.append({
                "type": "icu_pressure",
                "severity": "CRITICAL",
                "reason": "ICU occupancy is critically high with no available ICU beds."
            })

        # Rule 2: Diagnostic Bottleneck
        ct_queue = int(state.get("ct_queue", 0))
        avg_diagnostic_wait = float(state.get("avg_diagnostic_wait", 0.0))
        if ct_queue >= 20 or avg_diagnostic_wait >= 90:
            operational_anomalies.append({
                "type": "diagnostic_bottleneck",
                "severity": "HIGH",
                "reason": f"Diagnostic queue ({ct_queue}) or wait time ({avg_diagnostic_wait} min) exceeds operational threshold."
            })

        # Rule 3: ER Surge
        er_arrivals = int(state.get("er_arrivals", 0))
        er_queue = int(state.get("er_queue", 0))
        if er_arrivals >= 20 or er_queue >= 20:
            operational_anomalies.append({
                "type": "er_surge",
                "severity": "HIGH",
                "reason": f"Emergency arrivals ({er_arrivals}) or ER queue ({er_queue}) indicate critical surge."
            })

        # Rule 4: Staff Overload
        staff_workload = float(state.get("staff_workload", 0.0))
        if staff_workload >= 0.95:
            operational_anomalies.append({
                "type": "staff_overload",
                "severity": "HIGH",
                "reason": f"Staff workload ({int(staff_workload * 100)}%) is at maximum operational capacity."
            })

        # Rule 5: Task Backlog
        pending_tasks = int(state.get("pending_tasks", 0))
        if pending_tasks >= 60:
            operational_anomalies.append({
                "type": "task_backlog",
                "severity": "HIGH",
                "reason": f"Pending task backlog ({pending_tasks}) exceeds operational limits."
            })

        # Rule 6: Statistical ML Anomaly
        if ml_anomaly:
            operational_anomalies.append({
                "type": "statistical_anomaly",
                "severity": "MEDIUM",
                "reason": f"Statistical machine learning anomaly detected (ml_score: {round(ml_score, 4)})."
            })

        # 3. Overall Severity Ranking
        highest_rank = 0
        overall_severity = "NORMAL"

        for item in operational_anomalies:
            sev = item["severity"]
            rank = SEVERITY_RANK.get(sev, 0)
            if rank > highest_rank:
                highest_rank = rank
                overall_severity = sev

        is_anomaly = bool(len(operational_anomalies) > 0 or ml_anomaly)

        return {
            "is_anomaly": is_anomaly,
            "overall_severity": overall_severity if is_anomaly else "NORMAL",
            "ml_anomaly": ml_anomaly,
            "ml_score": round(ml_score, 4),
            "model_version": self.model_version,
            "operational_anomalies": operational_anomalies
        }

# Singleton instance
hybrid_detector = HybridAnomalyDetector()
