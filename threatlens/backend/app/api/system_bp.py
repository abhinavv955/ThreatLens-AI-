from flask import Blueprint, jsonify
from sqlalchemy import text
from app.database import db
from app.models.activity import Activity
from app.models.alert import Alert
from app.models.dataset import Dataset
from app.models.model_run import ModelRun
from app.ml.predictor import ThreatPredictor

system_bp = Blueprint("system_bp", __name__)

@system_bp.route("/system/status", methods=["GET"])
def get_system_status():
    # 1. API status
    api_ok = True

    # 2. Database connection check
    db_ok = False
    try:
        db.session.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    # 3. ML engine check
    ml_engine_ok = True
    try:
        import sklearn
        import joblib
    except ImportError:
        ml_engine_ok = False

    # 4. Active model check
    model_loaded = ThreatPredictor.is_model_ready()
    active_model = ModelRun.query.filter_by(status="ACTIVE").first()

    return jsonify({
        "success": True,
        "data": {
            "api": {"status": "Operational" if api_ok else "Degraded", "ok": api_ok},
            "database": {"status": "Connected" if db_ok else "Disconnected", "ok": db_ok},
            "ml_engine": {"status": "Ready" if ml_engine_ok else "Unavailable", "ok": ml_engine_ok},
            "active_model": {
                "status": "Loaded" if model_loaded else "Awaiting Training",
                "ok": model_loaded,
                "name": active_model.model_name if active_model else "Random Forest (Baseline Heuristic)",
                "version": active_model.version if active_model else "v1.0-baseline",
            },
            "counts": {
                "activities": Activity.query.count(),
                "alerts": Alert.query.count(),
                "unread_alerts": Alert.query.filter_by(status="UNREAD").count(),
                "datasets": Dataset.query.count(),
                "model_runs": ModelRun.query.count(),
            },
        }
    }), 200

@system_bp.route("/presets", methods=["GET"])
def get_activity_presets():
    """
    Returns realistic testing presets for instant inspection in the Analyze page.
    """
    presets = [
        {
            "id": "normal_http",
            "name": "Legitimate Web Traffic (HTTP GET)",
            "category": "Normal Traffic",
            "description": "Standard outbound HTTP connection with complete 3-way handshake and valid payload transfer.",
            "data": {
                "source_ip": "192.168.1.105",
                "source_port": 51240,
                "destination_ip": "10.0.0.15",
                "destination_port": 80,
                "protocol_type": "tcp",
                "service": "http",
                "flag": "SF",
                "duration": 0.12,
                "src_bytes": 450,
                "dst_bytes": 3200,
                "wrong_fragment": 0,
                "urgent": 0,
                "hot": 0,
                "num_failed_logins": 0,
                "num_compromised": 0,
                "root_shell": 0,
                "count": 4,
                "srv_count": 4,
                "serror_rate": 0.0,
                "rerror_rate": 0.0,
                "same_srv_rate": 1.0,
                "diff_srv_rate": 0.0,
            }
        },
        {
            "id": "dos_synflood",
            "name": "TCP SYN Flood Attack (DoS)",
            "category": "Denial of Service",
            "description": "Massive burst of incomplete TCP SYN handshakes (S0 flag) with 100% SYN error rate and zero payload.",
            "data": {
                "source_ip": "192.168.1.214",
                "source_port": 49152,
                "destination_ip": "10.0.0.15",
                "destination_port": 80,
                "protocol_type": "tcp",
                "service": "private",
                "flag": "S0",
                "duration": 0.0,
                "src_bytes": 0,
                "dst_bytes": 0,
                "wrong_fragment": 0,
                "urgent": 0,
                "hot": 0,
                "num_failed_logins": 0,
                "num_compromised": 0,
                "root_shell": 0,
                "count": 320,
                "srv_count": 12,
                "serror_rate": 1.0,
                "rerror_rate": 0.0,
                "same_srv_rate": 0.08,
                "diff_srv_rate": 0.12,
            }
        },
        {
            "id": "probe_portscan",
            "name": "Network Reconnaissance / PortScan (Probe)",
            "category": "Surveillance / Probe",
            "description": "Rapid scanning of multiple destination service ports with elevated rejection error rate and high service variance.",
            "data": {
                "source_ip": "192.168.1.189",
                "source_port": 60100,
                "destination_ip": "10.0.0.15",
                "destination_port": 135,
                "protocol_type": "tcp",
                "service": "private",
                "flag": "REJ",
                "duration": 0.02,
                "src_bytes": 40,
                "dst_bytes": 0,
                "wrong_fragment": 0,
                "urgent": 0,
                "hot": 0,
                "num_failed_logins": 0,
                "num_compromised": 0,
                "root_shell": 0,
                "count": 160,
                "srv_count": 2,
                "serror_rate": 0.05,
                "rerror_rate": 0.85,
                "same_srv_rate": 0.05,
                "diff_srv_rate": 0.90,
            }
        },
        {
            "id": "r2l_bruteforce",
            "name": "Credential Brute-Force Attempt (R2L)",
            "category": "Unauthorized Access",
            "description": "Repeated failed authentication attempts against remote administration service (SSH/Telnet).",
            "data": {
                "source_ip": "192.168.1.92",
                "source_port": 44320,
                "destination_ip": "10.0.0.15",
                "destination_port": 22,
                "protocol_type": "tcp",
                "service": "ssh",
                "flag": "SF",
                "duration": 8.5,
                "src_bytes": 380,
                "dst_bytes": 620,
                "wrong_fragment": 0,
                "urgent": 0,
                "hot": 2,
                "num_failed_logins": 4,
                "num_compromised": 0,
                "root_shell": 0,
                "count": 3,
                "srv_count": 3,
                "serror_rate": 0.0,
                "rerror_rate": 0.0,
                "same_srv_rate": 1.0,
                "diff_srv_rate": 0.0,
            }
        },
        {
            "id": "u2r_privilege_escalation",
            "name": "Buffer Overflow / Root Shell (U2R)",
            "category": "Privilege Escalation",
            "description": "Execution context exploit escalating standard user shell to an interactive root shell.",
            "data": {
                "source_ip": "192.168.1.77",
                "source_port": 53200,
                "destination_ip": "10.0.0.15",
                "destination_port": 23,
                "protocol_type": "tcp",
                "service": "telnet",
                "flag": "SF",
                "duration": 34.0,
                "src_bytes": 2800,
                "dst_bytes": 6400,
                "wrong_fragment": 0,
                "urgent": 0,
                "hot": 4,
                "num_failed_logins": 0,
                "num_compromised": 2,
                "root_shell": 1,
                "count": 1,
                "srv_count": 1,
                "serror_rate": 0.0,
                "rerror_rate": 0.0,
                "same_srv_rate": 1.0,
                "diff_srv_rate": 0.0,
            }
        }
    ]
    return jsonify({"success": True, "data": presets}), 200
