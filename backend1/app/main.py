from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

from app.api.auth import router as auth_router
from app.api.products import router as products_router
from app.socket_manager import sio
from app.api.audit_logs import router as audit_logs_router
from app.api.admin_users import router as admin_users_router

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
fastapi_app.include_router(audit_logs_router)
fastapi_app.include_router(admin_users_router)

@fastapi_app.get("/")
def root():
    return {"status": "ok"}

# עוטפים את FastAPI עם Socket.IO
app = socketio.ASGIApp(
    sio,
    other_asgi_app=fastapi_app,
    socketio_path="socket.io",
)
