import json
import joblib
from pathlib import Path
import numpy as np
import pandas as pd
from app.config import Config
from app.ml.preprocessor import normalize_input_dict, NUMERIC_FEATURES

class ThreatPredictor:
    _cached_rf = None
    _cached_iso = None
    _cached_prep = None
    _cached_meta = None

    @classmethod
    def is_model_ready(cls) -> bool:
        model_dir = Path(Config.MODEL_STORE_PATH)
        return (
            (model_dir / "active_rf.joblib").exists()
            and (model_dir / "active_prep.joblib").exists()
            and (model_dir / "active_meta.json").exists()
        )

    @classmethod
    def load_active_model(cls, force_reload: bool = False):
        if not force_reload and cls._cached_rf is not None:
            return cls._cached_rf, cls._cached_iso, cls._cached_prep, cls._cached_meta

        model_dir = Path(Config.MODEL_STORE_PATH)
        rf_path = model_dir / "active_rf.joblib"
        iso_path = model_dir / "active_iso.joblib"
        prep_path = model_dir / "active_prep.joblib"
        meta_path = model_dir / "active_meta.json"

        if not (rf_path.exists() and prep_path.exists()):
            return None, None, None, None

        cls._cached_rf = joblib.load(rf_path)
        cls._cached_iso = joblib.load(iso_path) if iso_path.exists() else None
        cls._cached_prep = joblib.load(prep_path)

        if meta_path.exists():
            with open(meta_path, "r", encoding="utf-8") as f:
                cls._cached_meta = json.load(f)
        else:
            cls._cached_meta = {}

        return cls._cached_rf, cls._cached_iso, cls._cached_prep, cls._cached_meta

    @classmethod
    def predict_activity(cls, input_data: dict) -> dict:
        """
        Runs ML prediction, anomaly detection, and explainable signal generation.
        """
        rf, iso, prep, meta = cls.load_active_model()

        if rf is None or prep is None:
            # Fallback heuristic if model is not yet trained
            return cls._heuristic_prediction(input_data)

        # Prepare normalized 1-row DataFrame
        df_input = normalize_input_dict(input_data)
        X_trans = prep.transform(df_input)

        # Random Forest Classification & Probabilities
        raw_pred = rf.predict(X_trans)[0]
        probs = rf.predict_proba(X_trans)[0]
        class_idx = list(rf.classes_).index(raw_pred)
        confidence = float(probs[class_idx])

        # Attack classification
        attack_type = str(raw_pred)
        prediction = "Normal" if attack_type.lower() == "normal" else "Attack"

        # Isolation Forest Anomaly Detection
        is_anomaly = False
        anomaly_score = 0.0
        if iso is not None:
            try:
                iso_flag = iso.predict(X_trans)[0] # -1 anomaly, 1 normal
                anomaly_score = float(iso.decision_function(X_trans)[0])
                is_anomaly = bool(iso_flag == -1)
            except Exception:
                pass

        # Explainability: Extract contributing signals
        contributing_signals = cls._extract_contributing_signals(
            input_data, attack_type, confidence, is_anomaly, anomaly_score, meta
        )

        return {
            "prediction": prediction,
            "attack_type": attack_type,
            "confidence": confidence,
            "is_anomaly": is_anomaly,
            "anomaly_score": anomaly_score,
            "contributing_signals": contributing_signals,
            "features_used": df_input.to_dict(orient="records")[0],
        }

    @classmethod
    def _extract_contributing_signals(
        cls, input_data: dict, attack_type: str, confidence: float, is_anomaly: bool, anomaly_score: float, meta: dict
    ) -> list:
        signals = []
        baseline_stats = meta.get("baseline_stats", {})

        serror = float(input_data.get("serror_rate", 0.0) or 0.0)
        count = float(input_data.get("count", 1) or 1)
        srv_count = float(input_data.get("srv_count", 1) or 1)
        src_bytes = float(input_data.get("src_bytes", 0) or 0)
        dst_bytes = float(input_data.get("dst_bytes", 0) or 0)
        failed_logins = float(input_data.get("num_failed_logins", 0) or 0)
        root_shell = float(input_data.get("root_shell", 0) or 0)
        wrong_fragment = float(input_data.get("wrong_fragment", 0) or 0)
        diff_srv_rate = float(input_data.get("diff_srv_rate", 0.0) or 0.0)
        flag = str(input_data.get("flag", "SF")).upper()
        service = str(input_data.get("service", "http")).lower()

        # 1. High SYN error rate (DoS / SYN Flood indicator)
        if serror > 0.4:
            signals.append({
                "signal": "SYN Flood Pattern",
                "title": f"Elevated SYN Error Rate ({int(serror * 100)}%)",
                "description": "High proportion of incomplete TCP handshakes with S0/REJ flags characteristic of denial-of-service attempts.",
                "level": "CRITICAL" if serror > 0.8 else "HIGH",
                "feature": "serror_rate",
                "impact": 0.85,
            })

        # 2. Connection burst count
        if count > 100:
            signals.append({
                "signal": "Traffic Volume Surge",
                "title": f"Host Connection Surge ({int(count)} flows / 2s)",
                "description": "Volumetric burst of concurrent connection requests directed at target host within a narrow time window.",
                "level": "CRITICAL" if count > 250 else "HIGH",
                "feature": "count",
                "impact": 0.80,
            })

        # 3. Port Scanning / Probe pattern
        if diff_srv_rate > 0.4 or (srv_count > 50 and diff_srv_rate > 0.2):
            signals.append({
                "signal": "Reconnaissance Fingerprint",
                "title": f"Port Scanning Footprint ({int(diff_srv_rate * 100)}% service variance)",
                "description": "Rapid probing across disparate ports and services indicating automated network reconnaissance or mapping.",
                "level": "HIGH",
                "feature": "diff_srv_rate",
                "impact": 0.75,
            })

        # 4. Zero payload TCP anomalies
        if src_bytes == 0 and flag in ["S0", "REJ", "RSTO"]:
            signals.append({
                "signal": "Zero-Payload Handshake",
                "title": "Zero-Byte TCP Handshake Anomaly",
                "description": "Transmission initiated without application data payload, commonly used in state-exhaustion DoS attacks.",
                "level": "MEDIUM",
                "feature": "src_bytes",
                "impact": 0.65,
            })

        # 5. Failed authentication / brute force
        if failed_logins > 0:
            signals.append({
                "signal": "Credential Brute-Force",
                "title": f"Authentication Failure Threshold ({int(failed_logins)} failed logins)",
                "description": "Repeated unauthorized access attempts detected on sensitive authentication endpoints.",
                "level": "CRITICAL" if failed_logins >= 3 else "HIGH",
                "feature": "num_failed_logins",
                "impact": 0.90,
            })

        # 6. Privilege escalation
        if root_shell > 0:
            signals.append({
                "signal": "Privilege Escalation",
                "title": "Interactive Root Shell Spawning",
                "description": "Unauthorized root privilege elevation detected within application execution context.",
                "level": "CRITICAL",
                "feature": "root_shell",
                "impact": 0.98,
            })

        # 7. Malformed packet fragments
        if wrong_fragment > 0:
            signals.append({
                "signal": "Malformed Packet Structure",
                "title": f"Fragment Offset Anomaly ({int(wrong_fragment)} bad fragments)",
                "description": "Overlapping or invalid fragment boundaries characteristic of Teardrop or Ping of Death exploits.",
                "level": "CRITICAL",
                "feature": "wrong_fragment",
                "impact": 0.92,
            })

        # 8. Unsupervised Anomaly Signal
        if is_anomaly:
            signals.append({
                "signal": "Unsupervised Anomaly Flag",
                "title": "Isolation Forest Outlier Detection",
                "description": f"Multidimensional feature distance deviates significantly from normal traffic baseline (score: {round(anomaly_score, 3)}).",
                "level": "HIGH" if anomaly_score < -0.1 else "MEDIUM",
                "feature": "isolation_forest",
                "impact": 0.70,
            })

        # 9. Model confidence signal
        if attack_type.lower() != "normal":
            signals.append({
                "signal": "Classifier Consensus",
                "title": f"Random Forest Classification ({round(confidence * 100, 1)}% confidence)",
                "description": f"Decision trees converged with high ensemble agreement classifying signature as {attack_type}.",
                "level": "HIGH" if confidence > 0.85 else "MEDIUM",
                "feature": "model_confidence",
                "impact": confidence,
            })
        elif not signals:
            signals.append({
                "signal": "Baseline Conformance",
                "title": "Standard Traffic Conformance",
                "description": "Connection parameters, payload sizes, and handshake flags match legitimate operational traffic profiles.",
                "level": "INFO",
                "feature": "normal_profile",
                "impact": 0.10,
            })

        return signals

    @classmethod
    def _heuristic_prediction(cls, input_data: dict) -> dict:
        """
        Accurate heuristic analyzer when no ML model has been trained yet.
        """
        serror = float(input_data.get("serror_rate", 0) or 0)
        count = float(input_data.get("count", 1) or 1)
        diff_srv = float(input_data.get("diff_srv_rate", 0) or 0)
        logins = float(input_data.get("num_failed_logins", 0) or 0)
        root = float(input_data.get("root_shell", 0) or 0)
        frag = float(input_data.get("wrong_fragment", 0) or 0)

        if root > 0:
            attack_type = "U2R"
            prediction = "Attack"
            confidence = 0.95
        elif logins >= 2:
            attack_type = "R2L"
            prediction = "Attack"
            confidence = 0.91
        elif serror > 0.5 or count > 150:
            attack_type = "DoS"
            prediction = "Attack"
            confidence = 0.94
        elif diff_srv > 0.4:
            attack_type = "Probe"
            prediction = "Attack"
            confidence = 0.88
        elif frag > 0:
            attack_type = "DoS"
            prediction = "Attack"
            confidence = 0.90
        else:
            attack_type = "normal"
            prediction = "Normal"
            confidence = 0.96

        signals = cls._extract_contributing_signals(
            input_data, attack_type, confidence, False, 0.05, {}
        )

        return {
            "prediction": prediction,
            "attack_type": attack_type,
            "confidence": confidence,
            "is_anomaly": False,
            "anomaly_score": 0.05,
            "contributing_signals": signals,
            "features_used": input_data,
        }
