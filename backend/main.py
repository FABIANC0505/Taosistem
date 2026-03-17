from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import init_db
import os
from app.routers import auth, users, products, metrics, orders, settings

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
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Registrar routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(products.router)
app.include_router(metrics.router)
app.include_router(orders.router)
app.include_router(settings.router)

@app.get("/health")
async def health():
    return {"status": "ok", "app": "RestauTech"}