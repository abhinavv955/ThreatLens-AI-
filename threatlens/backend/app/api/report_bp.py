from flask import Blueprint, jsonify
from app.services.report_service import ReportService

report_bp = Blueprint("report_bp", __name__)

@report_bp.route("/report/generate", methods=["POST"])
def generate_report():
    try:
        report = ReportService.generate_security_brief()
        return jsonify({"success": True, "data": report}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
