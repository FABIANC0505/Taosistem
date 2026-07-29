from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.should_init_db_on_startup:
        await init_db()
    else:
        print("DB init omitida en runtime serverless")
    print("RestauTech API iniciada")
    yield
    print("RestauTech API detenida")


def create_app() -> FastAPI:
    app = FastAPI(
        title="RestauTech API",
        version="1.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    local_upload_dir = Path(settings.LOCAL_UPLOAD_DIR)
    if not settings.is_r2_enabled and local_upload_dir.exists():
        app.mount("/uploads", StaticFiles(directory=str(local_upload_dir)), name="uploads")

    register_routers(app)

    @app.get("/health")
    async def health() -> dict[str, Any]:
        return {"status": "ok", "app": "RestauTech"}

    return app


def register_routers(app: FastAPI) -> None:
    try:
        from app.routers import auth, cashier, metrics, orders, products, settings as settings_router, users

        app.include_router(auth.router)
        app.include_router(users.router)
        app.include_router(products.router)
        app.include_router(metrics.router)
        app.include_router(orders.router)
        app.include_router(settings_router.router)
        app.include_router(cashier.router)
    except Exception as exc:  # pragma: no cover - defensive import guard
        print(f"Warning: could not import routers at startup: {exc}")


app = create_app()
