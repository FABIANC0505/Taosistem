import json
import redis.asyncio as aioredis
from app.core.config import settings

redis_client: aioredis.Redis | None = None

MENU_CACHE_KEY = "menu:publico"
MENU_CACHE_TTL = 3600  # 1 hora


async def init_redis():
    global redis_client
    redis_client = aioredis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        decode_responses=True,
    )
    await redis_client.ping()
    print("✅ Redis conectado correctamente.")


async def close_redis():
    if redis_client:
        await redis_client.aclose()


async def get_redis() -> aioredis.Redis:
    return redis_client


async def get_menu_cache() -> list | None:
    data = await redis_client.get(MENU_CACHE_KEY)
    return json.loads(data) if data else None


async def set_menu_cache(menu_data: list):
    await redis_client.setex(MENU_CACHE_KEY, MENU_CACHE_TTL,
                             json.dumps(menu_data, ensure_ascii=False))


async def invalidate_menu_cache():
    """Llama esto cuando admin edite producto o cocina marque agotado."""
    await redis_client.delete(MENU_CACHE_KEY)