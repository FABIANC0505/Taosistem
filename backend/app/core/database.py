from __future__ import annotations

import ssl
from pathlib import Path
from typing import Any

from sqlalchemy.engine import make_url
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.core.config import settings


Base = declarative_base()


def _prepare_engine_config(database_url: str) -> tuple[str, dict[str, Any]]:
    engine_kwargs: dict[str, Any] = {}
    if not database_url.startswith("mysql"):
        return database_url, engine_kwargs

    url = make_url(database_url)
    query = dict(url.query)
    ssl_requested = False

    for key in ("ssl-mode", "ssl_mode", "ssl"):
        value = query.pop(key, None)
        if value and str(value).lower() not in {"disabled", "disable", "false", "0"}:
            ssl_requested = True

    engine_kwargs["pool_pre_ping"] = True
    if ssl_requested or (url.host and url.host.endswith(".aivencloud.com")):
        engine_kwargs["connect_args"] = {"ssl": ssl.create_default_context()}

    normalized_url = url.set(query=query)
    return normalized_url.render_as_string(hide_password=False), engine_kwargs


DATABASE_URL, engine_kwargs = _prepare_engine_config(settings.get_database_url())

engine = create_async_engine(DATABASE_URL, **engine_kwargs)
session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    async with session_factory() as session:
        try:
            yield session
        finally:
            if session.in_transaction():
                await session.rollback()


def _bind_qmark_params(query: str, params: tuple | list | None) -> tuple[str, dict[str, Any]]:
    values = tuple(params or ())
    bind_names = [f"param_{index}" for index in range(len(values))]
    query_with_named_params = query
    for bind_name in bind_names:
        query_with_named_params = query_with_named_params.replace("?", f":{bind_name}", 1)
    return query_with_named_params, dict(zip(bind_names, values))


async def execute(db: AsyncSession, query: str, params: tuple | list | None = None):
    prepared_query, prepared_params = _bind_qmark_params(query, params)
    result = await db.execute(text(prepared_query), prepared_params)
    await db.commit()
    return result


async def fetch_all(db: AsyncSession, query: str, params: tuple | list | None = None):
    prepared_query, prepared_params = _bind_qmark_params(query, params)
    result = await db.execute(text(prepared_query), prepared_params)
    return [dict(row) for row in result.mappings().all()]


async def fetch_one(db: AsyncSession, query: str, params: tuple | list | None = None):
    prepared_query, prepared_params = _bind_qmark_params(query, params)
    result = await db.execute(text(prepared_query), prepared_params)
    row = result.mappings().first()
    return dict(row) if row else None


async def init_db():
    from app.models.app_setting import AppSetting  # noqa: F401
    from app.models.cashier import CashMovement, CashPayment, CashSession, WaiterAlert  # noqa: F401
    from app.models.orden import Order  # noqa: F401
    from app.models.producto import Product  # noqa: F401
    from app.models.user import User  # noqa: F401

    if DATABASE_URL.startswith("sqlite"):
        sqlite_path = DATABASE_URL.rsplit("/", 1)[-1]
        Path(sqlite_path).parent.mkdir(parents=True, exist_ok=True)

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)


async def close_db():
    await engine.dispose()
