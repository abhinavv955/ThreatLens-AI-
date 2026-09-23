import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from ..config import settings

logger = logging.getLogger("nutritrack.database")

def get_engine():
    # Attempt primary database connection (PostgreSQL)
    primary_url = settings.DATABASE_URL
    try:
        if primary_url.startswith("postgresql"):
            # Check if postgres connection works with quick timeout
            test_engine = create_engine(primary_url, connect_args={"connect_timeout": 3})
            with test_engine.connect():
                logger.info("Connected successfully to PostgreSQL database.")
                return test_engine
    except Exception as e:
        logger.warning(f"Could not connect to PostgreSQL ({e}). Falling back to SQLite for local development.")

    # SQLite fallback
    fallback_url = settings.SQLITE_FALLBACK_URL
    return create_engine(fallback_url, connect_args={"check_same_thread": False})

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
