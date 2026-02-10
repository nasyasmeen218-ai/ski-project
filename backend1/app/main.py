from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

from app.socket_manager import sio
from app.db.init_db import init_db

from app.api.auth import router as auth_router
from app.api.products import router as products_router
from app.api.rentals import router as rentals_router
from app.api.cart import router as cart_router
from app.api.orders import router as orders_router
from app.api.audit_logs import router as audit_logs_router
from app.api.admin_users import router as admin_users_router
from app.api.admin_reports import router as admin_reports_router

# -------------------------
# FastAPI app
# -------------------------
fastapi_app = FastAPI(title="SkiRent API")

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# Routers
# -------------------------
fastapi_app.include_router(auth_router)
fastapi_app.include_router(products_router)
fastapi_app.include_router(rentals_router)
fastapi_app.include_router(cart_router)
fastapi_app.include_router(orders_router)
fastapi_app.include_router(audit_logs_router)
fastapi_app.include_router(admin_users_router)
fastapi_app.include_router(admin_reports_router)


@fastapi_app.on_event("startup")
def startup_init_db():
    init_db()

@fastapi_app.get("/")
def root():
    return {"status": "ok"}

# -------------------------
# Socket.IO ASGI wrapper
# -------------------------
app = socketio.ASGIApp(
    sio,
    other_asgi_app=fastapi_app,
    socketio_path="socket.io",
)
