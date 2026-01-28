from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.db.session import get_db
from app.models.audit_log import AuditLog

router = APIRouter()


@router.get("")
def list_audit_logs(
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(200).all()

    return [
        {
            "id": str(l.id),
            "actorUserId": str(l.actor_user_id),
            "productId": str(l.product_id) if l.product_id else None,
            "action": l.action,
            "qty": l.qty,
            "meta": l.meta,
            "createdAt": l.created_at.isoformat() if l.created_at else None,
        }
        for l in logs
    ]
