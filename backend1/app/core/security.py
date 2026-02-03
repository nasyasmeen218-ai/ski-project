from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
auth_scheme = HTTPBearer()


# ---------- Password helpers ----------
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


# ---------- JWT helpers ----------
def create_access_token(subject: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings["JWT_EXPIRE_MINUTES"])
    payload = {
        "sub": subject,
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings["JWT_SECRET"], algorithm=settings["JWT_ALGORITHM"])


# ---------- Auth / Role guards ----------
def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(auth_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = creds.credentials

    try:
        payload = jwt.decode(token, settings["JWT_SECRET"], algorithms=[settings["JWT_ALGORITHM"]])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        user_uuid = UUID(str(user_id))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if hasattr(user, "is_active") and user.is_active is False:
        raise HTTPException(status_code=403, detail="User is inactive")

    if getattr(user, "is_blocked_until", None):
        now = datetime.now(timezone.utc)
        if user.is_blocked_until and user.is_blocked_until > now:
            raise HTTPException(status_code=403, detail="User is blocked")

    # אם יש משתמשים ישנים בלי role
    if not getattr(user, "role", None):
        user.role = "customer"

    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return current_user


def require_employee(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ("employee", "admin"):
        raise HTTPException(status_code=403, detail="Employee only")
    return current_user


def require_customer(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "customer":
        raise HTTPException(status_code=403, detail="Customers only")
    return current_user
