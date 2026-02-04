from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import RegisterRequest, LoginRequest
from app.services.auth_service import create_user, login_and_get_token
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()


@router.post("/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    try:
        user_role = getattr(payload, 'role', 'customer') 
        create_user(db, payload.username, payload.password, role=user_role)
        
        return login_and_get_token(db, payload.username, payload.password)
    except ValueError as e:
        if str(e) == "USERNAME_EXISTS":
            raise HTTPException(status_code=409, detail="Username already exists")
        raise HTTPException(status_code=400, detail="Registration failed")


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    try:
        return login_and_get_token(db, payload.username, payload.password)
    except ValueError as e:
        code = str(e)

        if code == "USER_BLOCKED":
            raise HTTPException(status_code=403, detail="User is blocked")

        if code == "INVALID_CREDENTIALS":
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # fallback
        raise HTTPException(status_code=400, detail=code)


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "username": current_user.username,
        "role": current_user.role,
        "is_active": bool(getattr(current_user, "is_active", True)),
    }
