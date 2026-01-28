from uuid import UUID
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def log_action(
    db: Session,
    actor_user_id: str,
    action: str,
    product_id: str | None = None,
    qty: int | None = None,
    meta: dict | None = None,
):
    log = AuditLog(
        actor_user_id=UUID(actor_user_id),
        product_id=UUID(product_id) if product_id else None,
        action=action,
        qty=qty,
        meta=meta,
    )
    db.add(log)
    db.commit()
