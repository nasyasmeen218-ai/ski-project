from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User


def create_user(db: Session, username: str, password: str) -> User:
    existing = db.query(User).filter(User.username == username).first()
    if existing:
        raise ValueError("USERNAME_EXISTS")

    user = User(
        username=username,
        password_hash=hash_password(password),
        role="employee",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, username: str, password: str) -> User:
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise ValueError("INVALID_CREDENTIALS")

    if not verify_password(password, user.password_hash):
        raise ValueError("INVALID_CREDENTIALS")

    return user


def login_and_get_token(db: Session, username: str, password: str) -> dict:
    user = authenticate_user(db, username, password)
    token = create_access_token(subject=str(user.id), role=user.role)
    return {
        "token": token,
        "user": {"id": str(user.id), "username": user.username, "role": user.role},
    }
