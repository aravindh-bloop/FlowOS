import os
import joblib
import pandas as pd
from typing import Dict, Any, List

# Resolve path to backend/models/flowos_waiting_time_model.pkl
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_CANDIDATE_PATHS = [
    os.path.abspath(os.path.join(CURRENT_DIR, "..", "..", "models", "flowos_waiting_time_model.pkl")),
    os.path.abspath(os.path.join(CURRENT_DIR, "..", "models", "flowos_waiting_time_model.pkl")),
    os.path.abspath(os.path.join(os.getcwd(), "models", "flowos_waiting_time_model.pkl")),
    os.path.abspath(os.path.join(os.getcwd(), "backend", "models", "flowos_waiting_time_model.pkl"))
]

MODEL_PATH = None
for p in MODEL_CANDIDATE_PATHS:
    if os.path.exists(p):
        MODEL_PATH = p
        break

if not MODEL_PATH:
    MODEL_PATH = MODEL_CANDIDATE_PATHS[0]

class WaitingTimePredictor:
    def __init__(self, model_path: str = MODEL_PATH):
        self.model_path = model_path
        self.pipeline = None
        self.features: List[str] = []
        self.model_version = "1.0.0"
        self._load_model()

    def _load_model(self):
        try:
            if self.model_path and os.path.exists(self.model_path):
                bundle = joblib.load(self.model_path)
                if isinstance(bundle, dict):
                    self.pipeline = bundle.get("pipeline")
                    self.features = bundle.get("features", [])
                    self.model_version = str(bundle.get("model_version", "1.0.0"))
                    print(f"[FlowOS Intelligence] Loaded waiting time model v{self.model_version} from {self.model_path}")
                else:
                    self.pipeline = bundle
                    print(f"[FlowOS Intelligence] Loaded standalone pipeline from {self.model_path}")
            else:
                print(f"[FlowOS Intelligence Warning] Waiting time model file not found at {self.model_path}")
        except Exception as e:
            print(f"[FlowOS Intelligence Error] Failed to load waiting time model: {e}")

    def predict(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predicts actual waiting time in minutes using the loaded GradientBoosting scikit-learn pipeline.
        """
        if self.pipeline is None:
            raise RuntimeError("Waiting time prediction model is not loaded.")

        # Create single-row DataFrame from input features
        input_df = pd.DataFrame([state])

        # Select features in the exact order stored in the model bundle
        if self.features:
            input_df = input_df[self.features]

        # Run pipeline prediction
        raw_pred = self.pipeline.predict(input_df)[0]
        predicted_time = round(float(raw_pred), 1)

        return {
            "predicted_waiting_time_minutes": predicted_time,
            "model_version": self.model_version
        }

# Singleton instance loaded once at startup
waiting_time_predictor = WaitingTimePredictor()
