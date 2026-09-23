import os
import uuid
from pathlib import Path
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from app.config import Config
from app.models.dataset import Dataset
from app.services.dataset_service import DatasetService
from app.ml.trainer import ModelTrainer

dataset_bp = Blueprint("dataset_bp", __name__)

@dataset_bp.route("/dataset/upload", methods=["POST"])
def upload_dataset():
    try:
        if "file" not in request.files:
            return jsonify({"success": False, "error": "No file uploaded in request"}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"success": False, "error": "Empty filename"}), 400

        if not file.filename.lower().endswith(".csv"):
            return jsonify({"success": False, "error": "Only CSV dataset files are supported"}), 400

        orig_name = secure_filename(file.filename) or "dataset.csv"
        unique_name = f"{uuid.uuid4().hex[:8]}_{orig_name}"
        save_path = Path(Config.UPLOAD_FOLDER) / unique_name
        file.save(save_path)

        target_col = request.form.get("target_column", "label")
        profile = DatasetService.save_and_profile_csv(
            filepath=str(save_path),
            original_filename=orig_name,
            target_column=target_col,
        )

        return jsonify({"success": True, "data": profile}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@dataset_bp.route("/datasets", methods=["GET"])
def list_datasets():
    try:
        datasets = Dataset.query.order_by(Dataset.uploaded_at.desc()).all()
        return jsonify({"success": True, "data": [d.to_dict() for d in datasets]}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@dataset_bp.route("/dataset/train", methods=["POST"])
def train_model_from_dataset():
    try:
        payload = request.get_json() or {}
        dataset_id = payload.get("dataset_id")

        if dataset_id:
            dataset = Dataset.query.get(dataset_id)
            if not dataset:
                return jsonify({"success": False, "error": "Specified dataset not found"}), 404
            data_path = dataset.filepath
        else:
            # Check latest active dataset, or use sample
            dataset = Dataset.query.order_by(Dataset.uploaded_at.desc()).first()
            if not dataset:
                # Create bundled sample dataset automatically
                dataset_dict = DatasetService.create_bundled_sample_dataset()
                dataset = Dataset.query.get(dataset_dict["id"])
            data_path = dataset.filepath

        # Run leak-free trainer
        version_name = payload.get("version") or f"v{dataset.id}.0"
        result = ModelTrainer.train(
            data_source=data_path,
            version_tag=version_name,
            dataset_id=dataset.id,
        )

        return jsonify({"success": True, "message": "Model trained and activated successfully", "data": result}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@dataset_bp.route("/dataset/generate-sample", methods=["POST"])
def generate_sample_dataset():
    try:
        dataset_dict = DatasetService.create_bundled_sample_dataset()
        return jsonify({"success": True, "data": dataset_dict}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
