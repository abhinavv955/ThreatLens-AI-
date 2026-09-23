from datetime import datetime, timezone
from app.database import db

class Alert(db.Model):
    __tablename__ = "alerts"

    id = db.Column(db.Integer, primary_key=True)
    activity_id = db.Column(db.Integer, db.ForeignKey("activities.id"), nullable=True)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    attack_type = db.Column(db.String(50), default="Unknown")
    risk_score = db.Column(db.Integer, default=50)
    severity = db.Column(db.String(20), default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    status = db.Column(db.String(20), default="UNREAD")    # UNREAD, ACKNOWLEDGED, RESOLVED
    acknowledged_at = db.Column(db.DateTime, nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)

    activity = db.relationship("Activity", back_populates="alerts")

    def to_dict(self):
        return {
            "id": self.id,
            "activity_id": self.activity_id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "time_formatted": self.timestamp.strftime("%H:%M:%S") if self.timestamp else None,
            "date_formatted": self.timestamp.strftime("%Y-%m-%d") if self.timestamp else None,
            "title": self.title,
            "description": self.description,
            "attack_type": self.attack_type,
            "risk_score": self.risk_score,
            "severity": self.severity,
            "status": self.status,
            "acknowledged_at": self.acknowledged_at.isoformat() if self.acknowledged_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "source_ip": self.activity.source_ip if self.activity else None,
            "destination_ip": self.activity.destination_ip if self.activity else None,
            "endpoint": f"{self.activity.source_ip}:{self.activity.source_port} → {self.activity.destination_ip}:{self.activity.destination_port}" if self.activity else None,
        }
