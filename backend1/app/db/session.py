# backend1/app/db/session.py

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Check your .env file.")

# מומלץ: pool_pre_ping כדי לא ליפול על חיבורים מתים
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    future=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,  # ✅ כדי שלא תקבלי אובייקטים “ריקים” אחרי commit
    future=True,
)


def get_db():
    """
    Dependency תקין:
    - פותח Session
    - מחזיר אותו ל-endpoint
    - סוגר אותו בסוף

    ⚠️ לא עושים rollback אוטומטי תמיד,
    כי זה מבטל שינויים גם כשכן עשית commit בתוך ה-endpoint.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
