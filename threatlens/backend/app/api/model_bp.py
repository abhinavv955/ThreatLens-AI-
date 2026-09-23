from flask import Blueprint, jsonify
from app.models.model_run import ModelRun
from app.ml.predictor import ThreatPredictor

model_bp = Blueprint("model_bp", __name__)

@model_bp.route("/model/performance", methods=["GET"])
def get_model_performance():
    try:
        active_model = ModelRun.query.filter_by(status="ACTIVE").first()
        if not active_model:
            # Check most recent model run regardless of status
            active_model = ModelRun.query.order_by(ModelRun.created_at.desc()).first()

        if not active_model:
            return jsonify({
                "success": True,
                "data": {
                    "is_active": False,
                    "message": "No model has been trained yet. Train a model in the Data Laboratory.",
                    "model": None,
                }
            }), 200

        return jsonify({
            "success": True,
            "data": {
                "is_active": True,
                "model": active_model.to_dict(),
            }
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@model_bp.route("/model/info", methods=["GET"])
def get_model_info():
    try:
        active_model = ModelRun.query.filter_by(status="ACTIVE").first()
        models = ModelRun.query.order_by(ModelRun.created_at.desc()).all()
        is_ready = ThreatPredictor.is_model_ready()

        return jsonify({
            "success": True,
            "data": {
                "is_ready": is_ready,
                "active_model": active_model.to_dict() if active_model else None,
                "history": [m.to_dict() for m in models],
            }
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
