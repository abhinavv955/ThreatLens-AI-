from flask import Blueprint, request, jsonify
from app.services.alert_service import AlertService

alerts_bp = Blueprint("alerts_bp", __name__)

@alerts_bp.route("/alerts", methods=["GET"])
def get_alerts():
    try:
        status = request.args.get("status")
        severity = request.args.get("severity")
        limit = int(request.args.get("limit", 50))
        offset = int(request.args.get("offset", 0))

        result = AlertService.get_alerts(
            status=status,
            severity=severity,
            limit=limit,
            offset=offset,
        )
        return jsonify({"success": True, "data": result}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@alerts_bp.route("/alerts/<int:alert_id>", methods=["PATCH"])
def update_alert(alert_id: int):
    try:
        payload = request.get_json() or {}
        new_status = payload.get("status", "ACKNOWLEDGED")
        updated = AlertService.update_alert_status(alert_id, new_status)
        if not updated:
            return jsonify({"success": False, "error": "Alert not found"}), 404
        return jsonify({"success": True, "data": updated}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
