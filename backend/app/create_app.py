from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.database import close_db, init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.should_init_db_on_startup:
        await init_db()
    else:
        print("DB init omitida en runtime serverless")
    print("RestauTech API iniciada")
    yield
    await close_db()
    print("RestauTech API detenida")


class BodySizeLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method in {"POST", "PUT", "PATCH"} and request.headers.get("content-length"):
            try:
                if int(request.headers["content-length"]) > 2_000_000:
                    return JSONResponse(status_code=413, content={"detail": "Body demasiado grande"})
            except ValueError:
                pass
        return await call_next(request)


def create_app() -> FastAPI:
    app = FastAPI(
        title="RestauTech API",
        version="1.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(BodySizeLimitMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:.*|http://127\.0\.0\.1:.*",
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

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(status_code=422, content={"detail": "Datos inválidos", "errors": exc.errors()})

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        import logging
        logging.error(f"Unhandled Exception: {exc}", exc_info=True)
        return JSONResponse(status_code=500, content={"detail": "Ha ocurrido un error interno del servidor."})

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
