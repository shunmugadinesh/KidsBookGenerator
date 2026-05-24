"""
scripts/init_db.py
Standalone script to create all PostgreSQL tables.
Run once before starting the app (or on first deploy).

Usage:
    python scripts/init_db.py
"""
import sys
import os

# Make sure app/ is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.connection import engine, Base
import app.db.models  # noqa: F401 — registers all ORM models

def main():
    print("Creating PostgreSQL tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("[OK] All tables created successfully.")
    except Exception as e:
        print(f"[FAILED] Failed to create tables: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
