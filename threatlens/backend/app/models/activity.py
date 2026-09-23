import json
from datetime import datetime, timezone
from app.database import db

class Activity(db.Model):
    __tablename__ = "activities"

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    source_ip = db.Column(db.String(45), default="192.168.1.100")
    source_port = db.Column(db.Integer, default=54321)
    destination_ip = db.Column(db.String(45), default="10.0.0.1")
    destination_port = db.Column(db.Integer, default=80)
    protocol = db.Column(db.String(10), default="tcp")
    service = db.Column(db.String(20), default="http")
    flag = db.Column(db.String(10), default="SF")

    # Key network features
    duration = db.Column(db.Float, default=0.0)
    src_bytes = db.Column(db.Integer, default=0)
    dst_bytes = db.Column(db.Integer, default=0)
    count = db.Column(db.Integer, default=1)
    srv_count = db.Column(db.Integer, default=1)
    serror_rate = db.Column(db.Float, default=0.0)
    rerror_rate = db.Column(db.Float, default=0.0)
    same_srv_rate = db.Column(db.Float, default=1.0)
    diff_srv_rate = db.Column(db.Float, default=0.0)
    features_json = db.Column(db.Text, nullable=True)

    # ML Output & Risk
    prediction = db.Column(db.String(20), default="Normal")  # "Normal" or "Attack"
    attack_type = db.Column(db.String(50), default="normal")  # normal, DoS, Probe, R2L, U2R
    confidence = db.Column(db.Float, default=0.95)           # 0.0 - 1.0
    anomaly_score = db.Column(db.Float, default=0.0)         # Isolation Forest score
    is_anomaly = db.Column(db.Boolean, default=False)
    risk_score = db.Column(db.Integer, default=10)           # 0 - 100
    severity = db.Column(db.String(20), default="LOW")       # LOW, MEDIUM, HIGH, CRITICAL
    explanation_json = db.Column(db.Text, nullable=True)      # Contributing signals list & details

    # Relationship to Alert
    alerts = db.relationship("Alert", back_populates="activity", cascade="all, delete-orphan")

    def to_dict(self):
        signals = []
        if self.explanation_json:
            try:
                signals = json.loads(self.explanation_json)
            except Exception:
                signals = []

        feat_dict = {}
        if self.features_json:
            try:
                feat_dict = json.loads(self.features_json)
            except Exception:
                feat_dict = {}

        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "time_formatted": self.timestamp.strftime("%H:%M:%S") if self.timestamp else None,
            "date_formatted": self.timestamp.strftime("%Y-%m-%d") if self.timestamp else None,
            "source_ip": self.source_ip,
            "source_port": self.source_port,
            "destination_ip": self.destination_ip,
            "destination_port": self.destination_port,
            "endpoint": f"{self.source_ip}:{self.source_port} → {self.destination_ip}:{self.destination_port}",
            "protocol": self.protocol.upper() if self.protocol else "TCP",
            "service": self.service.upper() if self.service else "HTTP",
            "flag": self.flag,
            "duration": self.duration,
            "src_bytes": self.src_bytes,
            "dst_bytes": self.dst_bytes,
            "count": self.count,
            "srv_count": self.srv_count,
            "serror_rate": self.serror_rate,
            "rerror_rate": self.rerror_rate,
            "same_srv_rate": self.same_srv_rate,
            "diff_srv_rate": self.diff_srv_rate,
            "features": feat_dict,
            "prediction": self.prediction,
            "attack_type": self.attack_type,
            "confidence": round(self.confidence * 100, 1),
            "confidence_raw": self.confidence,
            "anomaly_score": round(self.anomaly_score, 4),
            "is_anomaly": self.is_anomaly,
            "risk_score": self.risk_score,
            "severity": self.severity,
            "contributing_signals": signals,
        }
