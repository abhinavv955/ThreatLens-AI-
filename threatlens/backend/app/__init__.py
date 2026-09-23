import os
from pathlib import Path
from flask import Flask, send_from_directory, render_template, jsonify
from flask_cors import CORS
from app.config import Config
from app.database import db
from app.api import register_blueprints

def create_app(config_class=Config):
    # Path to frontend
    base_dir = Path(__file__).resolve().parent.parent.parent
    frontend_dir = base_dir / "frontend"
    static_dir = frontend_dir / "static"

    app = Flask(
        __name__,
        static_folder=str(static_dir),
        static_url_path="/static",
        template_folder=str(frontend_dir),
    )
    app.config.from_object(config_class)

    # Enable CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Init database
    db.init_app(app)

    # Register API blueprints
    register_blueprints(app)

    # Root route serves single page app
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        # If API route, fall through to 404
        if path.startswith("api/"):
            return jsonify({"error": "Endpoint not found"}), 404

        # If static file requested directly from root
        file_path = frontend_dir / path
        if path and file_path.is_file():
            return send_from_directory(str(frontend_dir), path)

        # Fallback to index.html for client-side routing
        index_file = frontend_dir / "index.html"
        if index_file.exists():
            return send_from_directory(str(frontend_dir), "index.html")
        return "ThreatLens AI Frontend Initializing...", 200

    # Auto-initialize DB and bundled baseline dataset
    with app.app_context():
        db.create_all()
        _init_baseline_data()

    return app

def _init_baseline_data():
    """
    Ensures sample dataset and baseline model artifacts are ready if needed.
    """
    try:
        from app.models.dataset import Dataset
        from app.services.dataset_service import DatasetService
        from app.ml.trainer import ModelTrainer
        from app.ml.predictor import ThreatPredictor

        # If no dataset registered, create the bundled dataset
        if Dataset.query.count() == 0:
            dataset_dict = DatasetService.create_bundled_sample_dataset()
            print(f"[ThreatLens] Initialized bundled baseline dataset (ID {dataset_dict['id']}).")

        # If no model trained yet, train the initial baseline model!
        if not ThreatPredictor.is_model_ready():
            dataset = Dataset.query.order_by(Dataset.uploaded_at.desc()).first()
            if dataset:
                print("[ThreatLens] Auto-training initial production Random Forest model...")
                train_res = ModelTrainer.train(
                    data_source=dataset.filepath,
                    version_tag="v1.0.0",
                    dataset_id=dataset.id,
                )
                print(f"[ThreatLens] Baseline model v1.0.0 trained! Accuracy: {round(train_res['accuracy']*100, 2)}%")
    except Exception as e:
        print(f"[ThreatLens] Notice during initial bootstrap: {e}")
