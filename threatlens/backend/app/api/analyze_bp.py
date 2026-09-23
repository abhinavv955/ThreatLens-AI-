from flask import Blueprint, request, jsonify
from app.services.activity_service import ActivityService

analyze_bp = Blueprint("analyze_bp", __name__)

@analyze_bp.route("/analyze", methods=["POST"])
def analyze_activity():
    try:
        payload = request.get_json() or {}
        result = ActivityService.analyze_and_record(payload)
        return jsonify({"success": True, "data": result}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@analyze_bp.route("/analyze/batch", methods=["POST"])
def analyze_batch():
    try:
        payload = request.get_json() or {}
        items = payload.get("items", [])
        results = []
        for item in items:
            res = ActivityService.analyze_and_record(item)
            results.append(res)
        return jsonify({"success": True, "count": len(results), "data": results}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
