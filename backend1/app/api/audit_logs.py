from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.user import User   # ✅ חדש – בשביל שם משתמש

router = APIRouter()


@router.get("")
def list_audit_logs(
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    # JOIN ל־users כדי להביא שם משתמש
    rows = (
        db.query(AuditLog, User.username)
        .join(User, User.id == AuditLog.actor_user_id)
        .order_by(AuditLog.created_at.desc())
        .limit(200)
        .all()
    )

    return [
        {
            "id": str(log.id),
            "actorUserId": str(log.actor_user_id),
            "actorUserName": username,   # ✅ זה מה שהפרונט צריך
            "productId": str(log.product_id) if log.product_id else None,
            "action": log.action,
            "qty": log.qty,
            "meta": log.meta,
            "createdAt": log.created_at.isoformat() if log.created_at else None,
        }
        for (log, username) in rows
    ]
