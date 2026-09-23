import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MODEL_STORE_DIR = BASE_DIR / "app" / "ml" / "model_store"
UPLOAD_DIR = BASE_DIR / "uploads"

DATA_DIR.mkdir(parents=True, exist_ok=True)
MODEL_STORE_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "threatlens-ai-secure-secret-key-2026")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", f"sqlite:///{DATA_DIR / 'threatlens.db'}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DATA_DIR = DATA_DIR
    MODEL_STORE_PATH = MODEL_STORE_DIR
    UPLOAD_FOLDER = UPLOAD_DIR
    MAX_CONTENT_LENGTH = 32 * 1024 * 1024  # 32 MB max upload
