"""
SQLAlchemy engine + session factory.
Reads POSTGRES_DSN from .env.  When running inside Docker the internal
DSN (POSTGRES_DSN_DOCKER) is used automatically.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

# Docker-aware DSN: inside container use the service name 'postgres'
_in_docker = os.path.exists("/.dockerenv")
POSTGRES_DSN = (
    os.getenv("POSTGRES_DSN_DOCKER") if _in_docker
    else os.getenv("POSTGRES_DSN", "postgresql://admin:admin123@localhost:5433/ai_books")
)

engine = create_engine(
    POSTGRES_DSN,
    pool_pre_ping=True,      # recycles stale connections
    pool_size=5,
    max_overflow=10,
    echo=False               # set True to log SQL queries during debugging
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency — yields a DB session and closes on exit."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
