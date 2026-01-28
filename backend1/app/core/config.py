import os
from dotenv import load_dotenv

# loads app/.env (relative to where the app is run)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))


def get_settings():
    return {
        "DATABASE_URL": os.getenv("DATABASE_URL", ""),
        "JWT_SECRET": os.getenv("JWT_SECRET", "change-me"),
        "JWT_ALGORITHM": os.getenv("JWT_ALGORITHM", "HS256"),
        "JWT_EXPIRE_MINUTES": int(os.getenv("JWT_EXPIRE_MINUTES", "60")),
    }


settings = get_settings()
