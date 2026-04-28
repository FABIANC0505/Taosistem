from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings
from pathlib import Path

database_url = settings.get_database_url()
# Si usamos SQLite, aseguramos que la carpeta del archivo exista antes de abrir conexión
if database_url.startswith("sqlite+"):
    try:
        sqlite_path = database_url.split("sqlite+aiosqlite:///", 1)[1]
    except Exception:
        sqlite_path = None
    if sqlite_path:
        parent = Path(sqlite_path).parent
        if str(parent) and not parent.exists():
            parent.mkdir(parents=True, exist_ok=True)

engine = create_async_engine(
    database_url,
    echo=settings.APP_ENV == "development",
)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    from app.models import User, Product, Order, AppSetting, CashSession, CashMovement, CashPayment, WaiterAlert
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("Conexion a MySQL exitosa y tablas creadas")
