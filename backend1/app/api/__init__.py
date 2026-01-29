# app/api/__init__.py
# This file marks the api directory as a Python package.
# Routers are imported directly in app.main.

__all__ = [
    "auth",
    "products",
    "rentals",
    "audit_logs",
]
