from flask import Blueprint, jsonify
from app.services.analytics_service import AnalyticsService

analytics_bp = Blueprint("analytics_bp", __name__)

@analytics_bp.route("/analytics", methods=["GET"])
def get_analytics():
    try:
        data = AnalyticsService.get_full_analytics()
        return jsonify({"success": True, "data": data}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
