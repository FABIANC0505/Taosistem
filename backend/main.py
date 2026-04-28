from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import init_db
import uvicorn
import os
from app.routers import auth, users, products, metrics, orders, settings as settings_router, cashier

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    print("RestauTech API iniciada")
    yield
    print("RestauTech API detenida")

app = FastAPI(
    title="RestauTech API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not settings.is_r2_enabled:
    os.makedirs(settings.LOCAL_UPLOAD_DIR, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=settings.LOCAL_UPLOAD_DIR), name="uploads")

# Registrar routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(products.router)
app.include_router(metrics.router)
app.include_router(orders.router)
app.include_router(settings_router.router)
app.include_router(cashier.router)

@app.get("/health")
async def health():
    return {"status": "ok", "app": "RestauTech"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
