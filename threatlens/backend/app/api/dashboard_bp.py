from flask import Blueprint, jsonify
from app.services.analytics_service import AnalyticsService

dashboard_bp = Blueprint("dashboard_bp", __name__)

@dashboard_bp.route("/dashboard", methods=["GET"])
def get_dashboard():
    try:
        data = AnalyticsService.get_dashboard_data()
        return jsonify({"success": True, "data": data}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
