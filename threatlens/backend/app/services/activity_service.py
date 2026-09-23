import json
import random
from datetime import datetime, timezone
from app.database import db
from app.models.activity import Activity
from app.ml.predictor import ThreatPredictor
from app.services.risk_engine import RiskEngine
from app.services.alert_service import AlertService

class ActivityService:
    @staticmethod
    def analyze_and_record(payload: dict) -> dict:
        """
        Processes a network activity payload through ML inference, risk calculation,
        stores the event in the database, and triggers alerts if applicable.
        """
        # IP and port defaults
        src_ip = payload.get("source_ip") or f"192.168.1.{random.randint(10, 220)}"
        dst_ip = payload.get("destination_ip") or "10.0.0.15"
        src_port = int(payload.get("source_port") or random.randint(30000, 65000))
        dst_port = int(payload.get("destination_port") or 80)
        protocol = str(payload.get("protocol_type") or payload.get("protocol") or "tcp").lower()
        service = str(payload.get("service") or "http").lower()
        flag = str(payload.get("flag") or "SF").upper()

        # Run ML Prediction and Anomaly Detection
        prediction_result = ThreatPredictor.predict_activity(payload)

        # Calculate Dynamic Risk & Severity
        risk_score, severity = RiskEngine.calculate_risk(
            attack_type=prediction_result["attack_type"],
            confidence=prediction_result["confidence"],
            is_anomaly=prediction_result["is_anomaly"],
            anomaly_score=prediction_result["anomaly_score"],
            service=service,
            input_data=payload,
        )

        # Build database Activity record
        activity = Activity(
            timestamp=datetime.now(timezone.utc),
            source_ip=src_ip,
            source_port=src_port,
            destination_ip=dst_ip,
            destination_port=dst_port,
            protocol=protocol,
            service=service,
            flag=flag,
            duration=float(payload.get("duration", 0.0) or 0.0),
            src_bytes=int(payload.get("src_bytes", 0) or 0),
            dst_bytes=int(payload.get("dst_bytes", 0) or 0),
            count=int(payload.get("count", 1) or 1),
            srv_count=int(payload.get("srv_count", 1) or 1),
            serror_rate=float(payload.get("serror_rate", 0.0) or 0.0),
            rerror_rate=float(payload.get("rerror_rate", 0.0) or 0.0),
            same_srv_rate=float(payload.get("same_srv_rate", 1.0) or 1.0),
            diff_srv_rate=float(payload.get("diff_srv_rate", 0.0) or 0.0),
            features_json=json.dumps(prediction_result.get("features_used", payload)),
            prediction=prediction_result["prediction"],
            attack_type=prediction_result["attack_type"],
            confidence=prediction_result["confidence"],
            anomaly_score=prediction_result["anomaly_score"],
            is_anomaly=prediction_result["is_anomaly"],
            risk_score=risk_score,
            severity=severity,
            explanation_json=json.dumps(prediction_result["contributing_signals"]),
        )

        db.session.add(activity)
        db.session.commit()

        # Automatically check and trigger alerts if dangerous or high risk
        alert = AlertService.create_alert_for_activity(activity)

        result_dict = activity.to_dict()
        result_dict["alert_created"] = alert is not None
        if alert:
            result_dict["alert_id"] = alert.id

        return result_dict

    @staticmethod
    def get_activities(
        query_str: str = None,
        detection_type: str = None,
        severity: str = None,
        start_date: str = None,
        end_date: str = None,
        limit: int = 50,
        offset: int = 0,
    ) -> dict:
        """
        Retrieves paginated, filtered activities for the Security Events page.
        """
        query = Activity.query.order_by(Activity.timestamp.desc())

        if query_str:
            q = f"%{query_str.strip()}%"
            query = query.filter(
                (Activity.source_ip.ilike(q))
                | (Activity.destination_ip.ilike(q))
                | (Activity.attack_type.ilike(q))
                | (Activity.service.ilike(q))
                | (Activity.protocol.ilike(q))
            )

        if detection_type and detection_type.upper() != "ALL":
            if detection_type.upper() in ["ATTACK", "ATTACKS"]:
                query = query.filter(Activity.prediction == "Attack")
            elif detection_type.upper() in ["NORMAL", "BENIGN"]:
                query = query.filter(Activity.prediction == "Normal")
            else:
                query = query.filter(Activity.attack_type.ilike(detection_type))

        if severity and severity.upper() != "ALL":
            query = query.filter(Activity.severity == severity.upper())

        total = query.count()
        records = query.offset(offset).limit(limit).all()

        return {
            "total": total,
            "activities": [r.to_dict() for r in records],
            "limit": limit,
            "offset": offset,
        }

    @staticmethod
    def get_activity_detail(activity_id: int) -> dict:
        """
        Returns full investigation details including related activity timeline.
        """
        activity = Activity.query.get(activity_id)
        if not activity:
            return None

        act_dict = activity.to_dict()

        # Fetch timeline of events from same source IP or destination IP
        related = (
            Activity.query.filter(
                (Activity.source_ip == activity.source_ip)
                | (Activity.destination_ip == activity.destination_ip)
            )
            .order_by(Activity.timestamp.desc())
            .limit(10)
            .all()
        )

        timeline = []
        for r in related:
            timeline.append({
                "id": r.id,
                "timestamp": r.timestamp.isoformat(),
                "time_formatted": r.timestamp.strftime("%H:%M:%S"),
                "is_current": r.id == activity.id,
                "prediction": r.prediction,
                "attack_type": r.attack_type,
                "risk_score": r.risk_score,
                "severity": r.severity,
                "endpoint": f"{r.source_ip}:{r.source_port} → {r.destination_ip}:{r.destination_port}",
            })

        act_dict["timeline"] = timeline
        return act_dict
