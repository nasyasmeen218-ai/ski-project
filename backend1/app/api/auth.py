from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.services.auth_service import create_user, login_and_get_token
from app.core.security import get_current_user
from app.models.user import User


router = APIRouter()


@router.post("/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    try:
        user = create_user(db, payload.username, payload.password)
        # מחזירים גם token מיד אחרי הרשמה (נוח לפרונט)
        result = login_and_get_token(db, payload.username, payload.password)
        return result
    except ValueError as e:
        if str(e) == "USERNAME_EXISTS":
            raise HTTPException(status_code=409, detail="Username already exists")
        raise HTTPException(status_code=400, detail="Registration failed")


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    try:
        return login_and_get_token(db, payload.username, payload.password)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "username": current_user.username,
        "role": current_user.role,
    }