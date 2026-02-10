from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
import os

ALGORITHM = "HS256"
SECRET_KEY = os.getenv("SECRET_KEY", "CHANGE_ME")
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# חשוב: בלי "/" בהתחלה כדי ש-Swagger יבנה את הבקשה נכון
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str | None = payload.get("sub")
        if not username:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(status_code=403, detail="User is inactive")

    # חסימה לפי זמן: אם יש תאריך והוא עדיין בעתיד -> חסום
    if user.is_blocked_until is not None:
        now = datetime.now(timezone.utc)
        blocked_until = user.is_blocked_until

        # אם שמרת ב-DB בלי tzinfo, נניח UTC
        if blocked_until.tzinfo is None:
            blocked_until = blocked_until.replace(tzinfo=timezone.utc)

        if blocked_until > now:
            raise HTTPException(status_code=403, detail="User is blocked")

    return user


def require_role(required_role: str):
    def _checker(user: User = Depends(get_current_user)) -> User:
        if user.role != required_role:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        return user
    return _checker


require_admin = require_role("admin")
require_customer = require_role("customer")
require_employee = require_role("employee")
