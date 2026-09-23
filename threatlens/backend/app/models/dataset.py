import json
from datetime import datetime, timezone
from app.database import db

class Dataset(db.Model):
    __tablename__ = "datasets"

    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    filepath = db.Column(db.String(512), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    file_size_bytes = db.Column(db.Integer, default=0)
    row_count = db.Column(db.Integer, default=0)
    column_count = db.Column(db.Integer, default=0)
    target_column = db.Column(db.String(50), default="label")
    columns_json = db.Column(db.Text, nullable=True)          # JSON list of columns and types
    missing_values_count = db.Column(db.Integer, default=0)
    class_distribution_json = db.Column(db.Text, nullable=True) # JSON dict of target distribution
    is_active = db.Column(db.Boolean, default=False)

    model_runs = db.relationship("ModelRun", back_populates="dataset", cascade="all, delete-orphan")

    def to_dict(self):
        cols = []
        if self.columns_json:
            try:
                cols = json.loads(self.columns_json)
            except Exception:
                cols = []

        class_dist = {}
        if self.class_distribution_json:
            try:
                class_dist = json.loads(self.class_distribution_json)
            except Exception:
                class_dist = {}

        return {
            "id": self.id,
            "filename": self.filename,
            "uploaded_at": self.uploaded_at.isoformat() if self.uploaded_at else None,
            "date_formatted": self.uploaded_at.strftime("%Y-%m-%d %H:%M") if self.uploaded_at else None,
            "file_size_bytes": self.file_size_bytes,
            "file_size_kb": round(self.file_size_bytes / 1024, 1),
            "row_count": self.row_count,
            "column_count": self.column_count,
            "target_column": self.target_column,
            "columns": cols,
            "missing_values_count": self.missing_values_count,
            "class_distribution": class_dist,
            "is_active": self.is_active,
        }
