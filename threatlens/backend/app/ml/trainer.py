import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
from app.config import Config
from app.database import db
from app.models.model_run import ModelRun
from app.ml.preprocessor import (
    create_preprocessor,
    ALL_FEATURE_COLUMNS,
    NUMERIC_FEATURES,
    CATEGORICAL_FEATURES,
)

# Standard Attack Categorization Mapping (from NSL-KDD / standard threat categories)
ATTACK_CATEGORY_MAP = {
    # Normal
    "normal": "normal",
    "safe": "normal",
    "0": "normal",
    "benign": "normal",
    # DoS
    "dos": "DoS",
    "syn_flood": "DoS",
    "neptune": "DoS",
    "smurf": "DoS",
    "pod": "DoS",
    "teardrop": "DoS",
    "land": "DoS",
    "back": "DoS",
    "apache2": "DoS",
    "udpstorm": "DoS",
    "mailbomb": "DoS",
    # Probe
    "probe": "Probe",
    "port_scan": "Probe",
    "portsweep": "Probe",
    "ipsweep": "Probe",
    "nmap": "Probe",
    "satan": "Probe",
    "saint": "Probe",
    "mscan": "Probe",
    # R2L
    "r2l": "R2L",
    "guess_passwd": "R2L",
    "ftp_write": "R2L",
    "imap": "R2L",
    "phf": "R2L",
    "multihop": "R2L",
    "warezmaster": "R2L",
    "warezclient": "R2L",
    "spy": "R2L",
    # U2R
    "u2r": "U2R",
    "buffer_overflow": "U2R",
    "loadmodule": "U2R",
    "rootkit": "U2R",
    "perl": "U2R",
    "sqlattack": "U2R",
    "xterm": "U2R",
    "ps": "U2R",
}

def normalize_label(val) -> str:
    s = str(val).strip().lower().replace(".", "").replace("-", "_")
    return ATTACK_CATEGORY_MAP.get(s, "DoS" if "dos" in s or "flood" in s else "Probe" if "scan" in s or "probe" in s else s.capitalize())

class ModelTrainer:
    @staticmethod
    def train(data_source, version_tag: str = None, dataset_id: int = None) -> dict:
        """
        Trains Random Forest and Isolation Forest models on dataset.
        Prevents data leakage by fitting preprocessors only on the training split.
        """
        if isinstance(data_source, (str, Path)):
            df = pd.read_csv(data_source)
        elif isinstance(data_source, pd.DataFrame):
            df = data_source.copy()
        else:
            raise ValueError("Unsupported data source format")

        # Detect target column
        target_candidates = ["label", "attack_type", "class", "target", "attack"]
        target_col = None
        for candidate in target_candidates:
            if candidate in df.columns:
                target_col = candidate
                break
        if not target_col:
            # Check last column
            target_col = df.columns[-1]

        # Normalize target labels
        y_raw = df[target_col].apply(normalize_label)

        # Ensure all required feature columns exist, fallback if missing
        X_df = pd.DataFrame()
        for col in ALL_FEATURE_COLUMNS:
            if col in df.columns:
                X_df[col] = df[col]
            else:
                if col in NUMERIC_FEATURES:
                    X_df[col] = 0.0
                else:
                    X_df[col] = "other"

        # Stratified train/test split
        X_train, X_test, y_train, y_test = train_test_split(
            X_df, y_raw, test_size=0.20, random_state=42, stratify=y_raw if len(y_raw.unique()) > 1 else None
        )

        # Build and fit leak-free preprocessor pipeline on training data ONLY
        preprocessor = create_preprocessor()
        X_train_transformed = preprocessor.fit_transform(X_train)
        X_test_transformed = preprocessor.transform(X_test)

        # Train Random Forest Classifier
        rf_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=16,
            min_samples_split=4,
            random_state=42,
            n_jobs=-1,
        )
        rf_model.fit(X_train_transformed, y_train)

        # Train Isolation Forest on normal instances for unsupervised anomaly detection
        normal_mask = (y_train == "normal")
        if normal_mask.sum() > 20:
            iso_train_data = X_train_transformed[normal_mask]
        else:
            iso_train_data = X_train_transformed

        iso_forest = IsolationForest(
            n_estimators=80,
            contamination=0.08,
            random_state=42,
            n_jobs=-1,
        )
        iso_forest.fit(iso_train_data)

        # Evaluate performance on test set
        y_pred = rf_model.predict(X_test_transformed)
        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
        rec = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
        f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))

        report_dict = classification_report(y_test, y_pred, output_dict=True, zero_division=0)

        # Extract Feature Importances and aggregate by feature name
        try:
            cat_encoder = preprocessor.named_transformers_["cat"].named_steps["encoder"]
            cat_feature_names = cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES).tolist()
            all_transformed_names = NUMERIC_FEATURES + cat_feature_names
            raw_importances = rf_model.feature_importances_

            feature_importance_dict = {}
            for name, imp in zip(all_transformed_names, raw_importances):
                # Group one-hot features under main feature group
                base_name = name
                for cat in CATEGORICAL_FEATURES:
                    if name.startswith(cat + "_"):
                        base_name = cat
                        break
                feature_importance_dict[base_name] = feature_importance_dict.get(base_name, 0.0) + float(imp)

            # Normalize to sum to 1.0
            total_imp = sum(feature_importance_dict.values()) or 1.0
            feature_importance_dict = {
                k: round(v / total_imp, 4) for k, v in feature_importance_dict.items()
            }
        except Exception:
            feature_importance_dict = {feat: 0.05 for feat in ALL_FEATURE_COLUMNS}

        # Calculate baseline statistics for numeric features (used for Explainability Signals)
        baseline_stats = {}
        for num_col in NUMERIC_FEATURES:
            baseline_stats[num_col] = {
                "mean": float(X_train[num_col].mean()),
                "std": float(X_train[num_col].std() if X_train[num_col].std() > 0 else 1.0),
                "q95": float(X_train[num_col].quantile(0.95)),
            }

        # Save artifacts
        model_dir = Path(Config.MODEL_STORE_PATH)
        model_dir.mkdir(parents=True, exist_ok=True)

        if not version_tag:
            version_tag = f"v{datetime.now(timezone.utc).strftime('%Y%m%d.%H%M%S')}"

        rf_path = model_dir / f"rf_{version_tag}.joblib"
        iso_path = model_dir / f"iso_{version_tag}.joblib"
        prep_path = model_dir / f"prep_{version_tag}.joblib"
        meta_path = model_dir / f"meta_{version_tag}.json"

        joblib.dump(rf_model, rf_path)
        joblib.dump(iso_forest, iso_path)
        joblib.dump(preprocessor, prep_path)

        metadata = {
            "version": version_tag,
            "trained_at": datetime.now(timezone.utc).isoformat(),
            "classes": rf_model.classes_.tolist(),
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "f1_score": f1,
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "baseline_stats": baseline_stats,
            "feature_importance": feature_importance_dict,
        }

        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)

        # Link also as active model pointers
        joblib.dump(rf_model, model_dir / "active_rf.joblib")
        joblib.dump(iso_forest, model_dir / "active_iso.joblib")
        joblib.dump(preprocessor, model_dir / "active_prep.joblib")
        with open(model_dir / "active_meta.json", "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)

        # Mark any previous model runs as ARCHIVED in DB
        ModelRun.query.filter_by(status="ACTIVE").update({"status": "ARCHIVED"})

        # Record ModelRun in SQLite DB
        model_run = ModelRun(
            model_name="Random Forest Classifier + Isolation Forest",
            version=version_tag,
            status="ACTIVE",
            dataset_id=dataset_id,
            accuracy=acc,
            precision=prec,
            recall=rec,
            f1_score=f1,
            train_samples=len(X_train),
            test_samples=len(X_test),
            feature_importances_json=json.dumps(feature_importance_dict),
            hyperparameters_json=json.dumps(rf_model.get_params()),
            metrics_by_class_json=json.dumps(report_dict),
            model_file_path=str(rf_path),
        )
        db.session.add(model_run)
        db.session.commit()

        return {
            "model_run_id": model_run.id,
            "version": version_tag,
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "f1_score": f1,
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "classes": rf_model.classes_.tolist(),
            "feature_importances": sorted(feature_importance_dict.items(), key=lambda x: x[1], reverse=True),
        }
