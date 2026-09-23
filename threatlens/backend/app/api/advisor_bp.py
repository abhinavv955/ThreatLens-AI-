from flask import Blueprint, request, jsonify
from app.services.advisor_service import ThreatAdvisorService

advisor_bp = Blueprint("advisor_bp", __name__)

@advisor_bp.route("/advisor/query", methods=["POST"])
def query_advisor():
    try:
        payload = request.get_json() or {}
        user_query = payload.get("query", "").strip()
        if not user_query:
            return jsonify({"success": False, "error": "Query string is required"}), 400

        result = ThreatAdvisorService.answer_query(user_query)
        return jsonify({"success": True, "data": result}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
