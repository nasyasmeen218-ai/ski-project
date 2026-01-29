from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# routers (התאימי אם השמות אצלך שונים)
from app.api.auth import router as auth_router
from app.api.products import router as products_router
from app.api.rentals import router as rentals_router
from app.api.audit_logs import router as audit_logs_router

app = FastAPI(title="SkiRent API")

# ✅ CORS — חובה כדי שהפרונט (5173) יוכל לדבר עם הבאקנד (8000)
# שימי לב: אנחנו מאפשרים גם localhost וגם 127.0.0.1 כדי שלא יהיה בלבול
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Routers
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(products_router, prefix="/products", tags=["products"])
app.include_router(rentals_router, prefix="/rentals", tags=["rentals"])
app.include_router(audit_logs_router, prefix="/audit-logs", tags=["audit-logs"])


@app.get("/health")
def health():
    return {"ok": True}
