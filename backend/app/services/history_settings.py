from datetime import datetime, timedelta, timezone
from sqlalchemy import delete, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.app_setting import AppSetting
from app.models.orden import Order, OrderStatus


ORDER_HISTORY_RETENTION_KEY = "order_history_retention_days"
DEFAULT_RETENTION_DAYS = 90


async def get_history_retention_days(db: AsyncSession) -> int:
    stmt = select(AppSetting).where(AppSetting.key == ORDER_HISTORY_RETENTION_KEY)
    result = await db.execute(stmt)
    setting = result.scalar_one_or_none()

    if not setting:
        return DEFAULT_RETENTION_DAYS

    try:
        return max(1, int(setting.value))
    except (ValueError, TypeError):
        return DEFAULT_RETENTION_DAYS


async def set_history_retention_days(db: AsyncSession, retention_days: int) -> int:
    stmt = select(AppSetting).where(AppSetting.key == ORDER_HISTORY_RETENTION_KEY)
    result = await db.execute(stmt)
    setting = result.scalar_one_or_none()

    if not setting:
        setting = AppSetting(key=ORDER_HISTORY_RETENTION_KEY, value=str(retention_days))
        db.add(setting)
    else:
        setting.value = str(retention_days)

    await db.commit()
    return retention_days


async def cleanup_expired_dispatched_orders(db: AsyncSession, retention_days: int) -> int:
    cutoff = datetime.now(timezone.utc) - timedelta(days=retention_days)
    delivered_at_expr = func.coalesce(Order.entregado_at, Order.created_at)

    stmt = delete(Order).where(
        Order.status == OrderStatus.ENTREGADO,
        delivered_at_expr < cutoff,
    )

    result = await db.execute(stmt)
    await db.commit()
    return result.rowcount or 0


async def get_dispatched_history(db: AsyncSession) -> dict:
    retention_days = await get_history_retention_days(db)
    await cleanup_expired_dispatched_orders(db, retention_days)

    delivered_at_expr = func.coalesce(Order.entregado_at, Order.created_at)

    daily_stmt = (
        select(
            func.date(delivered_at_expr).label("fecha"),
            func.count(Order.id).label("cantidad"),
        )
        .where(Order.status == OrderStatus.ENTREGADO)
        .group_by(func.date(delivered_at_expr))
        .order_by(func.date(delivered_at_expr))
    )

    monthly_stmt = text("""
        SELECT
            to_char(coalesce(entregado_at, created_at), 'YYYY-MM') AS mes,
            count(id) AS cantidad
        FROM orders
        WHERE status::text = 'ENTREGADO'
        GROUP BY 1
        ORDER BY 1
    """)

    daily_result = await db.execute(daily_stmt)
    monthly_result = await db.execute(monthly_stmt)

    dispatched_por_dia = [
        {"fecha": row.fecha.isoformat(), "cantidad": int(row.cantidad)}
        for row in daily_result.all()
    ]
    dispatched_por_mes = [
        {"mes": row.mes, "cantidad": int(row.cantidad)}
        for row in monthly_result.all()
    ]

    return {
        "retention_days": retention_days,
        "dispatched_por_dia": dispatched_por_dia,
        "dispatched_por_mes": dispatched_por_mes,
    }
