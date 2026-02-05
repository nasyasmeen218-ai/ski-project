from fastapi import FastAPI

from app.api.auth import router as auth_router
from app.api.products import router as products_router

app = FastAPI(title="SkiRent API")

# routers (ה-prefix כבר מוגדר בתוך כל router)
app.include_router(auth_router)
app.include_router(products_router)


@app.get("/")
def root():
    return {"status": "ok"}
