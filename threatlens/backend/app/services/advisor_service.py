from datetime import datetime, timezone
from app.database import db
from app.models.activity import Activity
from app.models.alert import Alert
from app.models.model_run import ModelRun
from app.services.risk_engine import RiskEngine

class ThreatAdvisorService:
    @staticmethod
    def answer_query(user_query: str) -> dict:
        """
        Analyzes the user's natural language question and generates
        a grounded, analytical response based purely on real database state.
        Never fabricates numbers or metrics.
        """
        q = (user_query or "").strip().lower()

        total_activities = Activity.query.count()
        total_attacks = Activity.query.filter(Activity.prediction == "Attack").count()
        total_anomalies = Activity.query.filter(Activity.is_anomaly == True).count()
        health = RiskEngine.calculate_security_health()
        active_model = ModelRun.query.filter_by(status="ACTIVE").first()
        unread_alerts = Alert.query.filter_by(status="UNREAD").count()

        # Highest risk event
        highest_risk = (
            Activity.query.order_by(Activity.risk_score.desc(), Activity.timestamp.desc()).first()
        )

        # Most recent attack
        latest_attack = (
            Activity.query.filter(Activity.prediction == "Attack")
            .order_by(Activity.timestamp.desc())
            .first()
        )

        # Query intent detection
        if total_activities == 0:
            return {
                "query": user_query,
                "response": (
                    "**ThreatLens AI Status: No activity has been analyzed yet.**\n\n"
                    "The intelligence database is currently unpopulated. You can:\n"
                    "1. Head to **Data Laboratory** to load and train the network intelligence model.\n"
                    "2. Navigate to **Analyze** to submit a network session or test preset packets (e.g. DoS SYN Flood, PortScan).\n"
                    "3. View real-time activity in **Live Security Monitor** once events start streaming."
                ),
                "data_points": {
                    "total_activities": 0,
                    "attacks": 0,
                    "health_score": 100,
                },
            }

        # 1. Health / Posture questions
        if any(w in q for w in ["health", "posture", "status", "score", "safe", "secure"]):
            resp = (
                f"### Security Posture Assessment\n\n"
                f"Current Network Security Health is **{health['score']} / 100** ({health['label']}).\n\n"
                f"**Telemetry Breakdown:**\n"
                f"- **Analyzed Sessions:** {total_activities} activities\n"
                f"- **Threats Detected:** {total_attacks} ({round(total_attacks / total_activities * 100, 1)}% threat ratio)\n"
                f"- **Statistical Anomalies:** {total_anomalies} flagged by Isolation Forest\n"
                f"- **Pending Alerts:** {unread_alerts} unacknowledged alerts\n\n"
                f"**Posture Factors:**\n"
                f"- Threat Frequency: {health['factors']['threat_frequency']['score']}/100\n"
                f"- High-Risk Density: {health['factors']['high_risk_events']['score']}/100\n"
                f"- Anomaly Factor: {health['factors']['recent_anomalies']['score']}/100\n"
                f"- Normal Baseline Ratio: {health['factors']['normal_traffic_ratio']['score']}/100"
            )
            return {"query": user_query, "response": resp, "data_points": health}

        # 2. Today / Recent activity questions
        if any(w in q for w in ["today", "recent", "what happened", "events", "summary", "overview"]):
            recent_events = Activity.query.order_by(Activity.timestamp.desc()).limit(5).all()
            event_bullets = []
            for ev in recent_events:
                status_icon = "⚠️" if ev.prediction == "Attack" else "✅"
                event_bullets.append(
                    f"{status_icon} **{ev.timestamp.strftime('%H:%M:%S')}** — {ev.prediction} ({ev.attack_type.upper()}) | "
                    f"Risk **{ev.risk_score}/100** ({ev.severity}) | `{ev.source_ip} → {ev.destination_ip}:{ev.destination_port}`"
                )

            events_str = "\n".join(event_bullets)
            resp = (
                f"### Activity Intelligence Summary\n\n"
                f"Across **{total_activities}** total inspected network sessions:\n"
                f"- **Malicious Events:** {total_attacks} attacks detected\n"
                f"- **Normal Traffic:** {total_activities - total_attacks} legitimate sessions\n"
                f"- **Isolation Forest Outliers:** {total_anomalies} anomalies\n\n"
                f"**Most Recent Activity Stream:**\n{events_str}\n\n"
                f"Network security health is presently operating at **{health['score']}/100**."
            )
            return {"query": user_query, "response": resp, "data_points": {"total": total_activities, "attacks": total_attacks}}

        # 3. Highest risk / Worst threat questions
        if any(w in q for w in ["highest", "worst", "critical", "danger", "severe", "top threat"]):
            if highest_risk:
                resp = (
                    f"### Maximum Risk Incident Report\n\n"
                    f"The highest risk event currently recorded in the database is:\n\n"
                    f"- **Classification:** {highest_risk.prediction} ({highest_risk.attack_type})\n"
                    f"- **Risk Score:** **{highest_risk.risk_score} / 100** ({highest_risk.severity})\n"
                    f"- **Model Confidence:** {round(highest_risk.confidence * 100, 1)}%\n"
                    f"- **Origin:** `{highest_risk.source_ip}:{highest_risk.source_port}`\n"
                    f"- **Target:** `{highest_risk.destination_ip}:{highest_risk.destination_port}` ({highest_risk.protocol.upper()}/{highest_risk.service.upper()})\n"
                    f"- **Recorded At:** {highest_risk.timestamp.strftime('%Y-%m-%d %H:%M:%S UTC')}\n\n"
                    f"Check the **Threat Alerts** or **Security Events** investigation drawer for complete contributing signals and timeline analysis."
                )
            else:
                resp = "No high-risk security incidents are currently recorded in the database."
            return {"query": user_query, "response": resp, "data_points": highest_risk.to_dict() if highest_risk else None}

        # 4. Model / ML questions
        if any(w in q for w in ["model", "ml", "accuracy", "algorithm", "random forest", "precision", "training"]):
            if active_model:
                resp = (
                    f"### Active Intelligence Model Telemetry\n\n"
                    f"- **Architecture:** {active_model.model_name}\n"
                    f"- **Active Version:** `{active_model.version}`\n"
                    f"- **Test Accuracy:** **{round(active_model.accuracy * 100, 2)}%**\n"
                    f"- **Weighted Precision:** {round(active_model.precision * 100, 2)}%\n"
                    f"- **Weighted Recall:** {round(active_model.recall * 100, 2)}%\n"
                    f"- **F1 Score:** **{round(active_model.f1_score * 100, 2)}%**\n"
                    f"- **Sample Distribution:** {active_model.train_samples} training rows, {active_model.test_samples} validation rows\n\n"
                    f"You can inspect full feature rankings (MDI) and per-class precision metrics in the **Model Center**."
                )
            else:
                resp = (
                    "### Machine Learning Engine Status\n\n"
                    "The active model has not yet completed a training run in the Data Laboratory. "
                    "The platform is currently operating in Baseline Heuristic mode. "
                    "Navigate to **Data Laboratory** to train a production Random Forest Classifier on the network dataset."
                )
            return {"query": user_query, "response": resp, "data_points": active_model.to_dict() if active_model else None}

        # 5. Alerts / Anomalies questions
        if any(w in q for w in ["alert", "anomaly", "anomalies", "outlier", "warning"]):
            resp = (
                f"### Threat Alerts & Anomaly Telemetry\n\n"
                f"- **Active Alerts:** {Alert.query.count()} total alerts recorded\n"
                f"- **Unread / Actionable:** **{unread_alerts}** unacknowledged alerts\n"
                f"- **Unsupervised Anomalies:** **{total_anomalies}** multi-dimensional outliers flagged by Isolation Forest\n\n"
                f"Navigate to **Threat Alerts** to acknowledge or resolve active security notices."
            )
            return {"query": user_query, "response": resp, "data_points": {"unread_alerts": unread_alerts, "anomalies": total_anomalies}}

        # Default fallback response
        resp = (
            f"### ThreatLens Security Intelligence\n\n"
            f"Current platform telemetry:\n"
            f"- **Analyzed Traffic:** {total_activities} sessions\n"
            f"- **Threats Identified:** {total_attacks} attacks\n"
            f"- **Current Posture:** **{health['score']} / 100** ({health['label']})\n"
            f"- **Unacknowledged Alerts:** {unread_alerts}\n\n"
            f"Ask me about:\n"
            f"- *'What happened today?'*\n"
            f"- *'What is our current security health score?'*\n"
            f"- *'What is the highest risk attack detected?'*\n"
            f"- *'Tell me about the active machine learning model'*."
        )
        return {"query": user_query, "response": resp, "data_points": {"activities": total_activities, "attacks": total_attacks}}
