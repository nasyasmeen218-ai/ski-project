from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# socket
from app.socket_manager import sio, socket_app

# routers
from app.api.auth import router as auth_router
from app.api.products import router as products_router
from app.api.rentals import router as rentals_router
from app.api.audit_logs import router as audit_logs_router
from app.api.admin_users import router as admin_users_router
from app.api.orders import router as orders_router
from app.api.cart import router as cart_router
from app.api.cart import router as cart_router
from app.api.admin_reports import router as admin_reports_router

app = FastAPI(title="SkiRent API")

# ✅ CORS
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

# ✅ socket events
@sio.event
async def connect(sid, environ):
    print(f"✅ Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"❌ Client disconnected: {sid}")

# ✅ routers
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(products_router, prefix="/products", tags=["products"])
app.include_router(rentals_router, prefix="/rentals", tags=["rentals"])
app.include_router(audit_logs_router, prefix="/audit-logs", tags=["audit-logs"])

# אלו כבר מגיעים עם prefix בתוך הקובץ שלהם
app.include_router(admin_users_router)
app.include_router(orders_router)
app.include_router(cart_router)
app.include_router(cart_router)
app.include_router(admin_reports_router)



@app.get("/health")
def health():
    return {"ok": True}

# ✅ mount socket.io (must be last)
app.mount("/socket.io", socket_app)
