from fastapi import FastAPI
from app.api.auth import router as auth_router
from app.api.products import router as products_router
from app.api.audit_logs import router as audit_logs_router
from app.api import rentals
from app.api.rentals import router as rentals_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Inventory Management API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(products_router, prefix="/products", tags=["products"])
app.include_router(audit_logs_router, prefix="/audit-logs", tags=["audit-logs"])
app.include_router(rentals_router, prefix="/rentals", tags=["rentals"])
app.include_router(rentals.router, prefix="/rentals", tags=["Rentals"])

@app.get("/health")
def health():
    return {"status": "ok"}
