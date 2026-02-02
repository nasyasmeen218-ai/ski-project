from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# מייבאים את הסוקט מהקובץ החדש
from app.socket_manager import sio, socket_app 

# routers
from app.api.auth import router as auth_router
from app.api.products import router as products_router
from app.api.rentals import router as rentals_router
from app.api.audit_logs import router as audit_logs_router

app = FastAPI(title="SkiRent API")

# ✅ 1. הגדרות CORS של FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ 2. אירועי סוקט
@sio.event
async def connect(sid, environ):
    print(f"✅ Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"❌ Client disconnected: {sid}")

# ✅ 3. Routers - הורדתי את ה-/api מה-prefix כדי למנוע שגיאות 404
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(products_router, prefix="/products", tags=["products"])
app.include_router(rentals_router, prefix="/rentals", tags=["rentals"])
app.include_router(audit_logs_router, prefix="/audit-logs", tags=["audit-logs"])

@app.get("/health")
def health():
    return {"ok": True}

# ✅ 4. חיבור ה-Socket.io ל-FastAPI
# חייב להישאר בסוף!
app.mount("/socket.io", socket_app)