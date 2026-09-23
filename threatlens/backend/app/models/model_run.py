import json
from datetime import datetime, timezone
from app.database import db

class ModelRun(db.Model):
    __tablename__ = "model_runs"

    id = db.Column(db.Integer, primary_key=True)
    model_name = db.Column(db.String(100), default="Random Forest Classifier")
    version = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    status = db.Column(db.String(30), default="ACTIVE")  # ACTIVE, ARCHIVED, TRAINING, FAILED
    dataset_id = db.Column(db.Integer, db.ForeignKey("datasets.id"), nullable=True)

    accuracy = db.Column(db.Float, default=0.0)
    precision = db.Column(db.Float, default=0.0)
    recall = db.Column(db.Float, default=0.0)
    f1_score = db.Column(db.Float, default=0.0)
    train_samples = db.Column(db.Integer, default=0)
    test_samples = db.Column(db.Integer, default=0)

    feature_importances_json = db.Column(db.Text, nullable=True) # Dict of feature -> float importance
    hyperparameters_json = db.Column(db.Text, nullable=True)
    metrics_by_class_json = db.Column(db.Text, nullable=True)
    model_file_path = db.Column(db.String(512), nullable=True)

    dataset = db.relationship("Dataset", back_populates="model_runs")

    def to_dict(self):
        feat_imp = {}
        if self.feature_importances_json:
            try:
                feat_imp = json.loads(self.feature_importances_json)
            except Exception:
                feat_imp = {}

        hyperparams = {}
        if self.hyperparameters_json:
            try:
                hyperparams = json.loads(self.hyperparameters_json)
            except Exception:
                hyperparams = {}

        metrics_class = {}
        if self.metrics_by_class_json:
            try:
                metrics_class = json.loads(self.metrics_by_class_json)
            except Exception:
                metrics_class = {}

        # Sort feature importances descending
        sorted_features = sorted(feat_imp.items(), key=lambda x: x[1], reverse=True)

        return {
            "id": self.id,
            "model_name": self.model_name,
            "version": self.version,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "date_formatted": self.created_at.strftime("%Y-%m-%d %H:%M") if self.created_at else None,
            "status": self.status,
            "dataset_id": self.dataset_id,
            "dataset_name": self.dataset.filename if self.dataset else "Default Dataset",
            "accuracy": round(self.accuracy * 100, 2) if self.accuracy else 0.0,
            "precision": round(self.precision * 100, 2) if self.precision else 0.0,
            "recall": round(self.recall * 100, 2) if self.recall else 0.0,
            "f1_score": round(self.f1_score * 100, 2) if self.f1_score else 0.0,
            "accuracy_raw": self.accuracy,
            "precision_raw": self.precision,
            "recall_raw": self.recall,
            "f1_score_raw": self.f1_score,
            "train_samples": self.train_samples,
            "test_samples": self.test_samples,
            "total_samples": self.train_samples + self.test_samples,
            "feature_importances": sorted_features,
            "hyperparameters": hyperparams,
            "metrics_by_class": metrics_class,
        }
