from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.core.config import settings

# Render provides DATABASE_URL starting with postgres://, which SQLAlchemy 2.0 requires as postgresql://
raw_db_url = settings.DATABASE_URL
if raw_db_url.startswith("postgres://"):
    raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)

is_sqlite = raw_db_url.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

try:
    engine = create_engine(
        raw_db_url,
        connect_args=connect_args,
        pool_pre_ping=not is_sqlite,
        pool_recycle=3600 if not is_sqlite else -1,
        echo=False
    )
except Exception as e:
    import logging
    logging.warning(f"Could not initialize engine for {raw_db_url}: {e}. Falling back to SQLite.")
    engine = create_engine(
        "sqlite:///./attendance.db",
        connect_args={"check_same_thread": False},
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
