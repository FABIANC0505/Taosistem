import aiosqlite
import json
from pathlib import Path
from app.core.config import settings
try:
    from sqlalchemy.orm import declarative_base
    Base = declarative_base()
except Exception:
    Base = None

# Note: SQLAlchemy `Base` removed during migration to aiosqlite.
# If any legacy modules import `Base`, update them to use the new DB helpers.


def _sqlite_path() -> str:
    url = settings.get_database_url()
    if url.startswith("sqlite+aiosqlite:///"):
        return url.split("sqlite+aiosqlite:///", 1)[1]
    if url.startswith("sqlite:///"):
        return url.split("sqlite:///", 1)[1]
    return "dev.db"


async def get_db():
    db_path = _sqlite_path()
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    conn = await aiosqlite.connect(db_path)
    conn.row_factory = aiosqlite.Row
    try:
        yield conn
    finally:
        await conn.close()


async def execute(db, query: str, params: tuple | list | None = None):
    if params is None:
        params = ()
    cur = await db.execute(query, params)
    await db.commit()
    return cur


async def fetch_all(db, query: str, params: tuple | list | None = None):
    cur = await db.execute(query, params or ())
    rows = await cur.fetchall()
    return [dict(row) for row in rows]


async def fetch_one(db, query: str, params: tuple | list | None = None):
    cur = await db.execute(query, params or ())
    row = await cur.fetchone()
    return dict(row) if row else None


async def init_db():
    db_path = _sqlite_path()
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(db_path) as db:
        await db.execute("PRAGMA foreign_keys = ON;")

        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(36) PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                email VARCHAR(200) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                rol VARCHAR(6) NOT NULL,
                activo BOOLEAN NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
            );
            """
        )

        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS app_settings (
                "key" VARCHAR(100) PRIMARY KEY,
                value VARCHAR(255) NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
            );
            """
        )

        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS products (
                id VARCHAR(36) PRIMARY KEY,
                nombre VARCHAR(200) NOT NULL,
                precio NUMERIC(10,2) NOT NULL,
                descripcion TEXT,
                imagen_url VARCHAR(500),
                categoria VARCHAR(100) NOT NULL,
                disponible BOOLEAN NOT NULL,
                agotado_por VARCHAR(36),
                agotado_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                FOREIGN KEY(agotado_por) REFERENCES users(id)
            );
            """
        )

        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS orders (
                id VARCHAR(36) PRIMARY KEY,
                id_mesero VARCHAR(36) NOT NULL,
                mesa_numero INTEGER,
                tipo_pedido VARCHAR(20) NOT NULL,
                cliente_nombre VARCHAR(150),
                cliente_telefono VARCHAR(30),
                direccion_entrega TEXT,
                status VARCHAR(14) NOT NULL,
                items TEXT NOT NULL,
                notas TEXT,
                total_amount NUMERIC(10,2) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                cocinando_at DATETIME,
                served_at DATETIME,
                entregado_at DATETIME,
                cancelado_at DATETIME,
                cancelado_por VARCHAR(36),
                motivo_cancelacion TEXT,
                FOREIGN KEY(id_mesero) REFERENCES users(id),
                FOREIGN KEY(cancelado_por) REFERENCES users(id)
            );
            """
        )

        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS cash_sessions (
                id VARCHAR(36) PRIMARY KEY,
                cashier_user_id VARCHAR(36) NOT NULL,
                opening_amount NUMERIC(10,2) NOT NULL,
                opening_note TEXT,
                opened_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                closing_counted_amount NUMERIC(10,2),
                closing_note TEXT,
                closed_at DATETIME,
                FOREIGN KEY(cashier_user_id) REFERENCES users(id)
            );
            """
        )

        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS waiter_alerts (
                id VARCHAR(36) PRIMARY KEY,
                mesa_numero INTEGER NOT NULL,
                cashier_user_id VARCHAR(36) NOT NULL,
                mesero_user_id VARCHAR(36),
                message TEXT NOT NULL,
                resolved BOOLEAN NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                resolved_at DATETIME,
                FOREIGN KEY(cashier_user_id) REFERENCES users(id),
                FOREIGN KEY(mesero_user_id) REFERENCES users(id)
            );
            """
        )

        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS cash_movements (
                id VARCHAR(36) PRIMARY KEY,
                session_id VARCHAR(36) NOT NULL,
                cashier_user_id VARCHAR(36) NOT NULL,
                movement_type VARCHAR(18) NOT NULL,
                amount NUMERIC(10,2) NOT NULL,
                description TEXT NOT NULL,
                related_order_id VARCHAR(36),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                FOREIGN KEY(session_id) REFERENCES cash_sessions(id),
                FOREIGN KEY(cashier_user_id) REFERENCES users(id),
                FOREIGN KEY(related_order_id) REFERENCES orders(id)
            );
            """
        )

        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS cash_payments (
                id VARCHAR(36) PRIMARY KEY,
                session_id VARCHAR(36) NOT NULL,
                cashier_user_id VARCHAR(36) NOT NULL,
                order_id VARCHAR(36),
                mesa_numero INTEGER,
                payment_method VARCHAR(13) NOT NULL,
                amount NUMERIC(10,2) NOT NULL,
                reference_note TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                FOREIGN KEY(session_id) REFERENCES cash_sessions(id),
                FOREIGN KEY(cashier_user_id) REFERENCES users(id),
                FOREIGN KEY(order_id) REFERENCES orders(id)
            );
            """
        )

        await db.commit()
        print("SQLite DB inicializada y tablas creadas")
