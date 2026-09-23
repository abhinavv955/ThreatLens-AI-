from datetime import datetime, timedelta, timezone
from collections import defaultdict
from sqlalchemy import func
from app.database import db
from app.models.activity import Activity
from app.models.model_run import ModelRun
from app.models.alert import Alert
from app.services.risk_engine import RiskEngine
from app.ml.predictor import ThreatPredictor

class AnalyticsService:
    @staticmethod
    def get_dashboard_data() -> dict:
        """
        Gathers real-time statistics for the Security Overview dashboard.
        Returns pure database-grounded metrics with zero fabricated numbers.
        """
        total_activities = Activity.query.count()
        total_threats = Activity.query.filter(Activity.prediction == "Attack").count()
        total_anomalies = Activity.query.filter(Activity.is_anomaly == True).count()
        health = RiskEngine.calculate_security_health()

        # Recent activities (up to 8)
        recent_records = (
            Activity.query.order_by(Activity.timestamp.desc()).limit(8).all()
        )
        recent_events = [r.to_dict() for r in recent_records]

        # Threat Landscape (actual attack distribution)
        threat_query = (
            db.session.query(Activity.attack_type, func.count(Activity.id))
            .filter(Activity.prediction == "Attack")
            .group_by(Activity.attack_type)
            .all()
        )
        threat_distribution = {atk: count for atk, count in threat_query}

        # Severity breakdown
        sev_query = (
            db.session.query(Activity.severity, func.count(Activity.id))
            .group_by(Activity.severity)
            .all()
        )
        severity_distribution = {sev: count for sev, count in sev_query}

        # Activity graph trends (last 24 hours, 7 days, 30 days)
        chart_data_24h = AnalyticsService._build_trend_buckets(hours=24, bucket_size_hours=1)
        chart_data_7d = AnalyticsService._build_trend_buckets(hours=24 * 7, bucket_size_hours=24)
        chart_data_30d = AnalyticsService._build_trend_buckets(hours=24 * 30, bucket_size_hours=24)

        # Active Model Info
        active_model = ModelRun.query.filter_by(status="ACTIVE").first()
        model_ready = ThreatPredictor.is_model_ready()

        return {
            "metrics": {
                "network_activity": {
                    "total": total_activities,
                    "label": "Network Activities Analyzed",
                    "has_data": total_activities > 0,
                },
                "threats_detected": {
                    "total": total_threats,
                    "rate": round((total_threats / total_activities * 100), 1) if total_activities > 0 else 0,
                    "label": "Malicious Signatures Detected",
                    "has_data": total_activities > 0,
                },
                "anomalies": {
                    "total": total_anomalies,
                    "label": "Statistical Anomalies Flagged",
                    "has_data": total_activities > 0,
                },
                "security_health": {
                    "score": health["score"],
                    "label": health["label"],
                    "factors": health["factors"],
                    "has_data": total_activities > 0,
                },
            },
            "activity_trends": {
                "24H": chart_data_24h,
                "7D": chart_data_7d,
                "30D": chart_data_30d,
            },
            "threat_landscape": {
                "total_threats": total_threats,
                "distribution": threat_distribution,
                "has_threats": total_threats > 0,
            },
            "severity_distribution": severity_distribution,
            "recent_events": recent_events,
            "system_status": {
                "operational": True,
                "api_connected": True,
                "database_connected": True,
                "model_loaded": model_ready,
                "active_model_name": active_model.model_name if active_model else "Random Forest (Default Heuristic)",
                "active_model_version": active_model.version if active_model else "Baseline",
            },
        }

    @staticmethod
    def _build_trend_buckets(hours: int, bucket_size_hours: int) -> dict:
        now = datetime.now(timezone.utc)
        since = now - timedelta(hours=hours)

        records = (
            Activity.query.filter(Activity.timestamp >= since)
            .order_by(Activity.timestamp.asc())
            .all()
        )

        labels = []
        normal_series = []
        suspicious_series = []
        attack_series = []

        total_steps = max(1, hours // bucket_size_hours)
        bucket_data = defaultdict(lambda: {"normal": 0, "suspicious": 0, "attack": 0})

        step_delta = timedelta(hours=bucket_size_hours)
        cur = since
        for step in range(total_steps):
            bucket_key = cur.strftime("%b %d %H:%M" if bucket_size_hours < 24 else "%b %d")
            labels.append(bucket_key)
            cur += step_delta

        for r in records:
            # Determine appropriate label bucket
            if bucket_size_hours < 24:
                b_key = r.timestamp.strftime("%b %d %H:%M")
            else:
                b_key = r.timestamp.strftime("%b %d")

            if r.prediction == "Attack":
                bucket_data[b_key]["attack"] += 1
            elif r.is_anomaly or r.risk_score >= 40:
                bucket_data[b_key]["suspicious"] += 1
            else:
                bucket_data[b_key]["normal"] += 1

        for lbl in labels:
            normal_series.append(bucket_data[lbl]["normal"])
            suspicious_series.append(bucket_data[lbl]["suspicious"])
            attack_series.append(bucket_data[lbl]["attack"])

        # If zero records exist in range, return clean empty series
        has_data = len(records) > 0
        return {
            "labels": labels,
            "normal": normal_series,
            "suspicious": suspicious_series,
            "attacks": attack_series,
            "has_data": has_data,
        }

    @staticmethod
    def get_full_analytics() -> dict:
        total_activities = Activity.query.count()
        total_threats = Activity.query.filter(Activity.prediction == "Attack").count()
        total_anomalies = Activity.query.filter(Activity.is_anomaly == True).count()
        health = RiskEngine.calculate_security_health()

        # Attack type distribution
        threat_query = (
            db.session.query(Activity.attack_type, func.count(Activity.id))
            .filter(Activity.prediction == "Attack")
            .group_by(Activity.attack_type)
            .all()
        )
        threat_distribution = {atk: count for atk, count in threat_query}

        # Severity distribution
        sev_query = (
            db.session.query(Activity.severity, func.count(Activity.id))
            .group_by(Activity.severity)
            .all()
        )
        severity_distribution = {
            "LOW": 0,
            "MEDIUM": 0,
            "HIGH": 0,
            "CRITICAL": 0,
        }
        for sev, count in sev_query:
            if sev in severity_distribution:
                severity_distribution[sev] = count

        # Risk distribution histogram: [0-20, 21-40, 41-60, 61-80, 81-100]
        risk_buckets = {
            "0-20": Activity.query.filter(Activity.risk_score <= 20).count(),
            "21-40": Activity.query.filter(Activity.risk_score > 20, Activity.risk_score <= 40).count(),
            "41-60": Activity.query.filter(Activity.risk_score > 40, Activity.risk_score <= 60).count(),
            "61-80": Activity.query.filter(Activity.risk_score > 60, Activity.risk_score <= 80).count(),
            "81-100": Activity.query.filter(Activity.risk_score > 80).count(),
        }

        # Protocols & Top Services
        proto_query = (
            db.session.query(Activity.protocol, func.count(Activity.id))
            .group_by(Activity.protocol)
            .all()
        )
        service_query = (
            db.session.query(Activity.service, func.count(Activity.id))
            .group_by(Activity.service)
            .order_by(func.count(Activity.id).desc())
            .limit(6)
            .all()
        )

        # Active Model Performance Metrics
        active_model = ModelRun.query.filter_by(status="ACTIVE").first()

        return {
            "overview": {
                "total_activities": total_activities,
                "total_threats": total_threats,
                "total_anomalies": total_anomalies,
                "health_score": health["score"],
                "health_label": health["label"],
                "health_factors": health["factors"],
            },
            "threat_distribution": threat_distribution,
            "severity_distribution": severity_distribution,
            "risk_distribution": risk_buckets,
            "protocols": {p.upper(): c for p, c in proto_query},
            "services": {s.upper(): c for s, c in service_query},
            "model_performance": active_model.to_dict() if active_model else None,
            "has_data": total_activities > 0,
        }
