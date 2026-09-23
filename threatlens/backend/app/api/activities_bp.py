from flask import Blueprint, request, jsonify
from app.services.activity_service import ActivityService

activities_bp = Blueprint("activities_bp", __name__)

@activities_bp.route("/activities", methods=["GET"])
def get_activities():
    try:
        q = request.args.get("q")
        detection_type = request.args.get("type")
        severity = request.args.get("severity")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        limit = int(request.args.get("limit", 20))
        offset = int(request.args.get("offset", 0))

        result = ActivityService.get_activities(
            query_str=q,
            detection_type=detection_type,
            severity=severity,
            start_date=start_date,
            end_date=end_date,
            limit=limit,
            offset=offset,
        )
        return jsonify({"success": True, "data": result}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@activities_bp.route("/activities/<int:activity_id>", methods=["GET"])
def get_activity_detail(activity_id: int):
    try:
        activity = ActivityService.get_activity_detail(activity_id)
        if not activity:
            return jsonify({"success": False, "error": "Activity not found"}), 404
        return jsonify({"success": True, "data": activity}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
