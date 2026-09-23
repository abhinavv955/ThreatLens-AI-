from datetime import datetime, timezone
from app.database import db
from app.models.alert import Alert
from app.models.activity import Activity

class AlertService:
    @staticmethod
    def create_alert_for_activity(activity: Activity) -> Alert:
        """
        Creates an alert if the activity exceeds severity or risk thresholds.
        """
        if activity.prediction == "Normal" and activity.risk_score < 40 and not activity.is_anomaly:
            return None

        # Build descriptive title
        if activity.attack_type.lower() == "dos":
            title = f"Potential Denial of Service (DoS) from {activity.source_ip}"
            desc = f"Volumetric or state-exhaustion DoS anomaly detected targeting {activity.destination_ip}:{activity.destination_port} (Risk {activity.risk_score}/100)."
        elif activity.attack_type.lower() == "probe":
            title = f"Reconnaissance / Port Scanning from {activity.source_ip}"
            desc = f"Network probing activity observed sweeping destination services on {activity.destination_ip}."
        elif activity.attack_type.lower() == "u2r":
            title = f"CRITICAL: User-to-Root Privilege Escalation on {activity.destination_ip}"
            desc = f"Unauthorized privilege elevation signature detected originating from {activity.source_ip}."
        elif activity.attack_type.lower() == "r2l":
            title = f"Unauthorized Remote Access Attempt from {activity.source_ip}"
            desc = f"Remote-to-local intrusion signature detected against {activity.destination_ip}:{activity.destination_port}."
        elif activity.is_anomaly:
            title = f"Unsupervised Anomaly Flagged from {activity.source_ip}"
            desc = f"High multidimensional feature deviation detected on {activity.protocol.upper()} connection to port {activity.destination_port}."
        else:
            title = f"Elevated Risk Network Activity from {activity.source_ip}"
            desc = f"Activity marked with risk score {activity.risk_score}/100 and severity {activity.severity}."

        alert = Alert(
            activity_id=activity.id,
            timestamp=activity.timestamp or datetime.now(timezone.utc),
            title=title,
            description=desc,
            attack_type=activity.attack_type,
            risk_score=activity.risk_score,
            severity=activity.severity,
            status="UNREAD",
        )
        db.session.add(alert)
        db.session.commit()
        return alert

    @staticmethod
    def get_alerts(status: str = None, severity: str = None, limit: int = 50, offset: int = 0):
        query = Alert.query.order_by(Alert.timestamp.desc())
        if status and status.upper() != "ALL":
            query = query.filter(Alert.status == status.upper())
        if severity and severity.upper() != "ALL":
            query = query.filter(Alert.severity == severity.upper())

        total = query.count()
        alerts = query.offset(offset).limit(limit).all()

        return {
            "total": total,
            "alerts": [a.to_dict() for a in alerts],
            "limit": limit,
            "offset": offset,
            "unread_count": Alert.query.filter_by(status="UNREAD").count(),
        }

    @staticmethod
    def update_alert_status(alert_id: int, new_status: str):
        alert = Alert.query.get(alert_id)
        if not alert:
            return None

        status_norm = new_status.upper().strip()
        if status_norm in ["ACKNOWLEDGED", "ACK"]:
            alert.status = "ACKNOWLEDGED"
            alert.acknowledged_at = datetime.now(timezone.utc)
        elif status_norm in ["RESOLVED", "RESOLVE"]:
            alert.status = "RESOLVED"
            alert.resolved_at = datetime.now(timezone.utc)
        elif status_norm in ["UNREAD"]:
            alert.status = "UNREAD"

        db.session.commit()
        return alert.to_dict()
