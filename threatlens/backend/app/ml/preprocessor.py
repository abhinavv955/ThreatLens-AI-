import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer

NUMERIC_FEATURES = [
    "duration",
    "src_bytes",
    "dst_bytes",
    "wrong_fragment",
    "urgent",
    "hot",
    "num_failed_logins",
    "num_compromised",
    "root_shell",
    "count",
    "srv_count",
    "serror_rate",
    "rerror_rate",
    "same_srv_rate",
    "diff_srv_rate",
]

CATEGORICAL_FEATURES = [
    "protocol_type",
    "service",
    "flag",
]

ALL_FEATURE_COLUMNS = NUMERIC_FEATURES + CATEGORICAL_FEATURES

# Default standard baseline values for single packet / activity inspection
DEFAULT_FEATURE_VALUES = {
    "duration": 0.0,
    "src_bytes": 180,
    "dst_bytes": 240,
    "wrong_fragment": 0,
    "urgent": 0,
    "hot": 0,
    "num_failed_logins": 0,
    "num_compromised": 0,
    "root_shell": 0,
    "count": 1,
    "srv_count": 1,
    "serror_rate": 0.0,
    "rerror_rate": 0.0,
    "same_srv_rate": 1.0,
    "diff_srv_rate": 0.0,
    "protocol_type": "tcp",
    "service": "http",
    "flag": "SF",
}

def create_preprocessor():
    """
    Creates a scikit-learn ColumnTransformer pipeline for leak-free preprocessing.
    """
    numeric_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    categorical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="constant", fill_value="other")),
            ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, NUMERIC_FEATURES),
            ("cat", categorical_transformer, CATEGORICAL_FEATURES),
        ]
    )

    return preprocessor

def normalize_input_dict(input_data: dict) -> pd.DataFrame:
    """
    Converts a single input dictionary or partial network payload into a valid
    1-row pandas DataFrame matching the required feature columns.
    """
    row = {}
    for col in ALL_FEATURE_COLUMNS:
        if col in input_data and input_data[col] is not None:
            val = input_data[col]
            if col in NUMERIC_FEATURES:
                try:
                    row[col] = float(val)
                except (ValueError, TypeError):
                    row[col] = DEFAULT_FEATURE_VALUES[col]
            else:
                row[col] = str(val).lower()
        else:
            row[col] = DEFAULT_FEATURE_VALUES[col]

    return pd.DataFrame([row])
