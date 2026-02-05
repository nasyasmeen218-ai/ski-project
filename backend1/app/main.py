from fastapi import FastAPI

from app.api.auth import router as auth_router
from app.api.products import router as products_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SkiRent API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],   # כולל OPTIONS
    allow_headers=["*"],   # כולל Content-Type, Authorization
)
# routers (ה-prefix כבר מוגדר בתוך כל router)
app.include_router(auth_router)
app.include_router(products_router)


@app.get("/")
def root():
    return {"status": "ok"}
