from typing import Dict, Tuple
from app.models.activity import Activity
from app.database import db

class RiskEngine:
    # Base risk weights for attack classes
    BASE_CLASS_WEIGHTS = {
        "normal": 8,
        "probe": 58,
        "dos": 78,
        "r2l": 86,
        "u2r": 96,
    }

    # Sensitive services that increase vulnerability score
    CRITICAL_SERVICES = {
        "ssh": 10,
        "telnet": 12,
        "ftp": 8,
        "auth": 10,
        "dns": 6,
        "smtp": 5,
    }

    @classmethod
    def calculate_risk(
        cls,
        attack_type: str,
        confidence: float,
        is_anomaly: bool,
        anomaly_score: float,
        service: str = "http",
        input_data: dict = None,
    ) -> Tuple[int, str]:
        """
        Calculates a dynamic, multi-factor 0-100 risk score and severity tier.
        """
        atk_key = str(attack_type).lower().strip()
        base = cls.BASE_CLASS_WEIGHTS.get(atk_key, 65 if atk_key != "normal" else 8)

        # Confidence weighting: high confidence increases risk for attacks, lowers for normal
        if atk_key == "normal":
            risk = base * (1.0 - (confidence * 0.4))
            if is_anomaly:
                risk += 25  # Anomaly in normal traffic triggers suspicion
        else:
            risk = base * (0.8 + (confidence * 0.2))
            if is_anomaly:
                risk += 8

        # Service criticality adjustment
        srv_penalty = cls.CRITICAL_SERVICES.get(str(service).lower().strip(), 0)
        risk += srv_penalty

        # Feature heuristics
        if input_data:
            root_shell = float(input_data.get("root_shell", 0) or 0)
            failed_logins = float(input_data.get("num_failed_logins", 0) or 0)
            wrong_frag = float(input_data.get("wrong_fragment", 0) or 0)

            if root_shell > 0:
                risk = max(risk, 95)
            if failed_logins >= 3:
                risk += 12
            if wrong_frag > 0:
                risk += 10

        # Clamp between 0 and 100
        final_risk = int(round(max(0, min(100, risk))))

        # Determine Severity Level
        if final_risk >= 85:
            severity = "CRITICAL"
        elif final_risk >= 65:
            severity = "HIGH"
        elif final_risk >= 35:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        return final_risk, severity

    @classmethod
    def calculate_security_health(cls) -> Dict:
        """
        Calculates dynamic 0-100 security health score and factor breakdowns
        from actual database activities.
        """
        total_activities = Activity.query.count()
        if total_activities == 0:
            return {
                "score": 100,
                "label": "Optimal",
                "factors": {
                    "threat_frequency": {"name": "Threat frequency", "score": 100, "status": "No threats detected"},
                    "high_risk_events": {"name": "High-risk events", "score": 100, "status": "0 high-risk events"},
                    "recent_anomalies": {"name": "Recent anomalies", "score": 100, "status": "0 anomalies"},
                    "normal_traffic_ratio": {"name": "Normal traffic ratio", "score": 100, "status": "100% normal"},
                },
                "total_events": 0,
            }

        attacks_count = Activity.query.filter(Activity.prediction == "Attack").count()
        high_risk_count = Activity.query.filter(Activity.risk_score >= 65).count()
        anomaly_count = Activity.query.filter(Activity.is_anomaly == True).count()
        normal_count = Activity.query.filter(Activity.prediction == "Normal").count()

        # Factors calculation (0 - 100 sub-scores, where 100 is best)
        attack_ratio = attacks_count / total_activities
        threat_freq_score = max(0, int(round((1.0 - attack_ratio) * 100)))

        high_risk_ratio = high_risk_count / total_activities
        high_risk_score = max(0, int(round((1.0 - high_risk_ratio) * 100)))

        anomaly_ratio = anomaly_count / total_activities
        anomaly_factor_score = max(0, int(round((1.0 - anomaly_ratio) * 100)))

        normal_ratio = normal_count / total_activities
        normal_ratio_score = int(round(normal_ratio * 100))

        # Overall weighted composite health score
        composite = (
            (threat_freq_score * 0.35)
            + (high_risk_score * 0.35)
            + (anomaly_factor_score * 0.15)
            + (normal_ratio_score * 0.15)
        )
        health_score = max(5, min(100, int(round(composite))))

        if health_score >= 85:
            health_label = "Optimal"
        elif health_score >= 70:
            health_label = "Stable"
        elif health_score >= 50:
            health_label = "Degraded"
        else:
            health_label = "Critical Risk"

        return {
            "score": health_score,
            "label": health_label,
            "factors": {
                "threat_frequency": {
                    "name": "Threat frequency",
                    "score": threat_freq_score,
                    "status": f"{attacks_count} threats ({round(attack_ratio * 100, 1)}%)",
                },
                "high_risk_events": {
                    "name": "High-risk events",
                    "score": high_risk_score,
                    "status": f"{high_risk_count} events >= 65 risk",
                },
                "recent_anomalies": {
                    "name": "Recent anomalies",
                    "score": anomaly_factor_score,
                    "status": f"{anomaly_count} outliers flagged",
                },
                "normal_traffic_ratio": {
                    "name": "Normal traffic ratio",
                    "score": normal_ratio_score,
                    "status": f"{round(normal_ratio * 100, 1)}% benign baseline",
                },
            },
            "total_events": total_activities,
        }
