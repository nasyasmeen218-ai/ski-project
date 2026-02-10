from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import get_db
from app.core.security import require_admin
from app.models.user import User
from app.models.audit_log import AuditLog

router = APIRouter(prefix="/admin", tags=["admin-users"])


def _parse_uuid(id_str: str) -> UUID:
    try:
        return UUID(id_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user_id")


@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    users = db.query(User).order_by(User.username.asc()).all()
    return [
        {
            "id": str(u.id),
            "username": u.username,
            "role": u.role,
            "is_active": bool(getattr(u, "is_active", True)),
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


@router.patch("/users/{user_id}/block")
def block_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    uid = _parse_uuid(user_id)

    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Cannot block admin user")

    user.is_active = False
    db.commit()
    db.refresh(user)

    return {"id": str(user.id), "is_active": bool(user.is_active)}


@router.patch("/users/{user_id}/unblock")
def unblock_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    uid = _parse_uuid(user_id)

    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = True
    db.commit()
    db.refresh(user)

    return {"id": str(user.id), "is_active": bool(user.is_active)}


@router.get("/users/{user_id}/actions")
def user_actions(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    uid = _parse_uuid(user_id)

    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    logs = (
        db.query(AuditLog)
        .filter(AuditLog.actor_user_id == user.id)
        .order_by(AuditLog.created_at.desc())
        .limit(200)
        .all()
    )

    return [
        {
            "id": str(l.id),
            "action": l.action,
            "qty": l.qty,
            "meta": l.meta,
            "createdAt": l.created_at.isoformat() if l.created_at else None,
        }
        for l in logs
    ]


@router.patch("/users/{user_id}/make-admin")
def make_user_admin(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    uid = _parse_uuid(user_id)

    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = "admin"
    db.commit()
    db.refresh(user)

    return {"message": "User promoted successfully", "role": user.role}
