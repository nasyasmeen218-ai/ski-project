from app.db.session import engine
from app.db.base import Base
from app.models.user import User  # noqa: F401
from app.models.product import Product  # noqa: F401
from app.models.audit_log import AuditLog  # noqa: F401
from app.models.rental import Rental  # noqa: F401


# חשוב: לייבא מודלים כדי ש-Base יכיר אותם
from app.models.user import User  # noqa: F401


def init_db():
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("✅ DB tables created")
