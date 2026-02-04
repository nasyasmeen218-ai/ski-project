from fastapi import FastAPI

from app.api.auth import router as auth_router
from app.api.products import router as products_router

# אם יש לך עוד ראוטרים בפרויקט (cart/orders/rentals וכו) אפשר להוסיף גם אותם כאן.
# חשוב לא לכלול את אותו router פעמיים כדי שלא יהיו כפילויות ב-Swagger.

app = FastAPI(title="SkiRent API")

app.include_router(auth_router)        # auth_router כבר עם prefix="/auth"
app.include_router(products_router)    # products_router כבר עם prefix="/products" (בהנחה)

@app.get("/")
def root():
    return {"status": "ok"}
