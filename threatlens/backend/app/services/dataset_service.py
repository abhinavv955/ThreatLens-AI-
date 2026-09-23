import os
import json
import random
from pathlib import Path
import pandas as pd
from datetime import datetime, timezone
from app.config import Config
from app.database import db
from app.models.dataset import Dataset
from app.ml.preprocessor import ALL_FEATURE_COLUMNS, NUMERIC_FEATURES, CATEGORICAL_FEATURES

class DatasetService:
    @staticmethod
    def save_and_profile_csv(filepath: str, original_filename: str, target_column: str = "label") -> dict:
        """
        Reads, profiles, and registers a CSV dataset in the database.
        """
        p = Path(filepath)
        file_size = p.stat().st_size

        # Read CSV
        df = pd.read_csv(filepath)

        # Autodetect target column if provided does not match
        if target_column not in df.columns:
            for cand in ["label", "attack_type", "class", "target", "attack"]:
                if cand in df.columns:
                    target_column = cand
                    break
            if target_column not in df.columns:
                target_column = df.columns[-1]

        # Profile columns
        cols_meta = []
        for col in df.columns:
            dtype_str = str(df[col].dtype)
            missing = int(df[col].isnull().sum())
            sample_val = str(df[col].dropna().iloc[0]) if len(df[col].dropna()) > 0 else ""
            cols_meta.append({
                "name": col,
                "type": "numeric" if "float" in dtype_str or "int" in dtype_str else "categorical",
                "missing": missing,
                "sample": sample_val[:30],
            })

        # Class distribution
        class_dist = df[target_column].astype(str).value_counts().to_dict()

        # Total missing
        total_missing = int(df.isnull().sum().sum())

        dataset = Dataset(
            filename=original_filename,
            filepath=str(p.resolve()),
            file_size_bytes=file_size,
            row_count=len(df),
            column_count=len(df.columns),
            target_column=target_column,
            columns_json=json.dumps(cols_meta),
            missing_values_count=total_missing,
            class_distribution_json=json.dumps(class_dist),
            is_active=True,
        )

        db.session.add(dataset)
        db.session.commit()

        return dataset.to_dict()

    @staticmethod
    def create_bundled_sample_dataset() -> Dataset:
        """
        Generates a rich, realistic network traffic dataset CSV for instant training
        with NSL-KDD / network flow features and balanced normal/attack instances.
        """
        sample_path = Path(Config.DATA_DIR) / "sample_network_traffic.csv"

        rows = []
        # 1. Normal HTTP / HTTPS traffic (~550 instances)
        for _ in range(550):
            rows.append({
                "duration": round(random.uniform(0.01, 1.2), 3),
                "protocol_type": "tcp",
                "service": random.choice(["http", "http", "http", "smtp", "dns"]),
                "flag": "SF",
                "src_bytes": random.randint(120, 1800),
                "dst_bytes": random.randint(400, 8500),
                "wrong_fragment": 0,
                "urgent": 0,
                "hot": 0,
                "num_failed_logins": 0,
                "num_compromised": 0,
                "root_shell": 0,
                "count": random.randint(1, 12),
                "srv_count": random.randint(1, 10),
                "serror_rate": round(random.uniform(0.0, 0.05), 2),
                "rerror_rate": round(random.uniform(0.0, 0.05), 2),
                "same_srv_rate": round(random.uniform(0.85, 1.0), 2),
                "diff_srv_rate": round(random.uniform(0.0, 0.15), 2),
                "label": "normal",
            })

        # 2. Normal SSH / Admin sessions (~100 instances)
        for _ in range(100):
            rows.append({
                "duration": round(random.uniform(5.0, 120.0), 2),
                "protocol_type": "tcp",
                "service": "ssh",
                "flag": "SF",
                "src_bytes": random.randint(1500, 12000),
                "dst_bytes": random.randint(2500, 35000),
                "wrong_fragment": 0,
                "urgent": 0,
                "hot": 0,
                "num_failed_logins": 0,
                "num_compromised": 0,
                "root_shell": 0,
                "count": random.randint(1, 3),
                "srv_count": random.randint(1, 3),
                "serror_rate": 0.0,
                "rerror_rate": 0.0,
                "same_srv_rate": 1.0,
                "diff_srv_rate": 0.0,
                "label": "normal",
            })

        # 3. DoS - SYN Flood / Neptune (~250 instances)
        for _ in range(250):
            rows.append({
                "duration": 0.0,
                "protocol_type": "tcp",
                "service": "private",
                "flag": random.choice(["S0", "S0", "REJ"]),
                "src_bytes": 0,
                "dst_bytes": 0,
                "wrong_fragment": 0,
                "urgent": 0,
                "hot": 0,
                "num_failed_logins": 0,
                "num_compromised": 0,
                "root_shell": 0,
                "count": random.randint(140, 480),
                "srv_count": random.randint(2, 25),
                "serror_rate": round(random.uniform(0.85, 1.0), 2),
                "rerror_rate": round(random.uniform(0.0, 0.1), 2),
                "same_srv_rate": round(random.uniform(0.05, 0.2), 2),
                "diff_srv_rate": round(random.uniform(0.05, 0.2), 2),
                "label": "DoS",
            })

        # 4. Probe - Portsweep / Nmap / IPsweep (~180 instances)
        for _ in range(180):
            rows.append({
                "duration": round(random.uniform(0.0, 0.05), 3),
                "protocol_type": random.choice(["tcp", "icmp"]),
                "service": random.choice(["eco_i", "finger", "telnet", "http", "private"]),
                "flag": random.choice(["SF", "REJ", "RSTO"]),
                "src_bytes": random.randint(0, 100),
                "dst_bytes": 0,
                "wrong_fragment": 0,
                "urgent": 0,
                "hot": 0,
                "num_failed_logins": 0,
                "num_compromised": 0,
                "root_shell": 0,
                "count": random.randint(80, 220),
                "srv_count": random.randint(1, 4),
                "serror_rate": round(random.uniform(0.0, 0.2), 2),
                "rerror_rate": round(random.uniform(0.4, 0.95), 2),
                "same_srv_rate": round(random.uniform(0.0, 0.1), 2),
                "diff_srv_rate": round(random.uniform(0.65, 1.0), 2),
                "label": "Probe",
            })

        # 5. R2L - Credential Brute-Force / Guess Password (~80 instances)
        for _ in range(80):
            rows.append({
                "duration": round(random.uniform(1.0, 15.0), 2),
                "protocol_type": "tcp",
                "service": random.choice(["telnet", "ftp", "ssh"]),
                "flag": "SF",
                "src_bytes": random.randint(100, 600),
                "dst_bytes": random.randint(150, 800),
                "wrong_fragment": 0,
                "urgent": 0,
                "hot": random.randint(1, 4),
                "num_failed_logins": random.randint(2, 6),
                "num_compromised": 0,
                "root_shell": 0,
                "count": random.randint(1, 5),
                "srv_count": random.randint(1, 5),
                "serror_rate": 0.0,
                "rerror_rate": 0.0,
                "same_srv_rate": 1.0,
                "diff_srv_rate": 0.0,
                "label": "R2L",
            })

        # 6. U2R - Buffer Overflow / Root Shell (~40 instances)
        for _ in range(40):
            rows.append({
                "duration": round(random.uniform(15.0, 65.0), 2),
                "protocol_type": "tcp",
                "service": "telnet",
                "flag": "SF",
                "src_bytes": random.randint(1200, 4500),
                "dst_bytes": random.randint(3000, 9500),
                "wrong_fragment": 0,
                "urgent": 0,
                "hot": random.randint(2, 6),
                "num_failed_logins": 0,
                "num_compromised": random.randint(1, 4),
                "root_shell": 1,
                "count": 1,
                "srv_count": 1,
                "serror_rate": 0.0,
                "rerror_rate": 0.0,
                "same_srv_rate": 1.0,
                "diff_srv_rate": 0.0,
                "label": "U2R",
            })

        df_sample = pd.DataFrame(rows)
        # Shuffle
        df_sample = df_sample.sample(frac=1.0, random_state=42).reset_index(drop=True)
        df_sample.to_csv(sample_path, index=False)

        # Profile and register in DB
        return DatasetService.save_and_profile_csv(
            filepath=str(sample_path),
            original_filename="sample_network_traffic.csv",
            target_column="label",
        )
