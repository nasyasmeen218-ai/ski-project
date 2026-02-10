from sqlalchemy import inspect, text

from app.db.base import Base
from app.db.session import engine
from app.models.user import User  # noqa: F401
from app.models.product import Product  # noqa: F401
from app.models.audit_log import AuditLog  # noqa: F401
from app.models.rental import Rental  # noqa: F401


def _ensure_products_columns() -> None:
    inspector = inspect(engine)
    if not inspector.has_table("products"):
        return

    existing_columns = {col["name"] for col in inspector.get_columns("products")}
    missing_columns = {
        "rental_price": "FLOAT DEFAULT 0.0",
        "taken_quantity": "INTEGER NOT NULL DEFAULT 0",
    }

    dialect = engine.dialect.name

    with engine.begin() as conn:
        for column_name, column_definition in missing_columns.items():
            if column_name in existing_columns:
                continue

            if dialect == "postgresql":
                conn.execute(
                    text(
                        f"ALTER TABLE products ADD COLUMN IF NOT EXISTS {column_name} {column_definition}"
                    )
                )
            else:
                conn.execute(
                    text(
                        f"ALTER TABLE products ADD COLUMN {column_name} {column_definition}"
                    )
                )


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    _ensure_products_columns()


if __name__ == "__main__":
    init_db()
    print("✅ DB tables created")
