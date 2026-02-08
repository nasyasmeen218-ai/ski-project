from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

from app.socket_manager import sio

from app.api.auth import router as auth_router
from app.api.products import router as products_router
from app.api.rentals import router as rentals_router
from app.api.audit_logs import router as audit_logs_router
from app.api.admin_users import router as admin_users_router
from app.api.admin_reports import router as admin_reports_router
from app.api.cart import router as cart_router  # ✅ ADD

fastapi_app = FastAPI(title="SkiRent API")

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

fastapi_app.include_router(auth_router)
fastapi_app.include_router(products_router)
fastapi_app.include_router(rentals_router)
fastapi_app.include_router(audit_logs_router)
fastapi_app.include_router(admin_users_router)
fastapi_app.include_router(admin_reports_router)
fastapi_app.include_router(cart_router)  # ✅ ADD

@fastapi_app.get("/")
def root():
    return {"status": "ok"}

app = socketio.ASGIApp(
    sio,
    other_asgi_app=fastapi_app,
    socketio_path="socket.io",
)
