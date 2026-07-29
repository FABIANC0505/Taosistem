from collections import defaultdict
from datetime import datetime, timedelta
import enum
import json
from app.core.database import fetch_all, fetch_one, execute


ORDER_HISTORY_RETENTION_KEY = "order_history_retention_days"
DEFAULT_RETENTION_DAYS = 90


class OrderStatus(str, enum.Enum):
    PENDIENTE = "pendiente"
    EN_PREPARACION = "en_preparacion"
    LISTO = "listo"
    ENTREGADO = "entregado"
    CANCELADO = "cancelado"


async def get_history_retention_days(db) -> int:
    setting = await fetch_one(
        db,
        "SELECT value FROM app_settings WHERE key = ?",
        (ORDER_HISTORY_RETENTION_KEY,),
    )

    if not setting:
        return DEFAULT_RETENTION_DAYS

    try:
        return max(1, int(setting.get("value")))
    except (ValueError, TypeError):
        return DEFAULT_RETENTION_DAYS


async def set_history_retention_days(db, retention_days: int) -> int:
    existing = await fetch_one(
        db,
        "SELECT key FROM app_settings WHERE key = ?",
        (ORDER_HISTORY_RETENTION_KEY,),
    )
    if existing:
        await execute(
            db,
            "UPDATE app_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?",
            (str(retention_days), ORDER_HISTORY_RETENTION_KEY),
        )
    else:
        await execute(
            db,
            "INSERT INTO app_settings (key, value) VALUES (?, ?)",
            (ORDER_HISTORY_RETENTION_KEY, str(retention_days)),
        )
    return retention_days


async def cleanup_expired_dispatched_orders(db, retention_days: int) -> int:
    cutoff = datetime.utcnow() - timedelta(days=retention_days)
    orders = await fetch_all(
        db,
        "SELECT id, created_at, entregado_at FROM orders WHERE status = ?",
        (OrderStatus.ENTREGADO.value,),
    )
    expired_ids = []
    for order in orders:
        delivered_at_value = order.get("entregado_at") or order.get("created_at")
        if not delivered_at_value:
            continue
        if isinstance(delivered_at_value, str):
            try:
                delivered_at = datetime.fromisoformat(delivered_at_value.replace("Z", "+00:00"))
            except ValueError:
                continue
        else:
            delivered_at = delivered_at_value
        if delivered_at < cutoff:
            expired_ids.append(order["id"])

    deleted = 0
    for order_id in expired_ids:
        await execute(db, "DELETE FROM orders WHERE id = ?", (order_id,))
        deleted += 1
    return deleted


def _parse_json_items(items_value):
    if items_value is None:
        return []
    if isinstance(items_value, list):
        return items_value
    if isinstance(items_value, str):
        try:
            parsed = json.loads(items_value)
            return parsed if isinstance(parsed, list) else []
        except json.JSONDecodeError:
            return []
    return []


async def get_dispatched_history(db) -> dict:
    retention_days = await get_history_retention_days(db)
    await cleanup_expired_dispatched_orders(db, retention_days)

    orders = await fetch_all(
        db,
        "SELECT * FROM orders WHERE status = ?",
        (OrderStatus.ENTREGADO.value,),
    )

    per_day: dict[str, int] = defaultdict(int)
    per_month: dict[str, int] = defaultdict(int)

    for order in orders:
        delivered_at = order.get("entregado_at") or order.get("created_at")
        if not delivered_at:
            continue
        if isinstance(delivered_at, str):
            try:
                delivered_at = datetime.fromisoformat(delivered_at.replace("Z", "+00:00"))
            except ValueError:
                continue
        per_day[delivered_at.date().isoformat()] += 1
        per_month[delivered_at.strftime("%Y-%m")] += 1

    return {
        "retention_days": retention_days,
        "dispatched_por_dia": [
            {"fecha": fecha, "cantidad": cantidad}
            for fecha, cantidad in sorted(per_day.items())
        ],
        "dispatched_por_mes": [
            {"mes": mes, "cantidad": cantidad}
            for mes, cantidad in sorted(per_month.items())
        ],
    }


async def get_orders_history(db, limit: int = 100, mesero_id: str | None = None) -> dict:
    retention_days = await get_history_retention_days(db)
    await cleanup_expired_dispatched_orders(db, retention_days)

    if mesero_id:
        orders = await fetch_all(
            db,
            "SELECT * FROM orders WHERE status IN (?, ?) AND id_mesero = ?",
            (OrderStatus.ENTREGADO.value, OrderStatus.CANCELADO.value, mesero_id),
        )
    else:
        orders = await fetch_all(
            db,
            "SELECT * FROM orders WHERE status IN (?, ?)",
            (OrderStatus.ENTREGADO.value, OrderStatus.CANCELADO.value),
        )

    orders = sorted(
        orders,
        key=lambda order: order.get("entregado_at") or order.get("cancelado_at") or order.get("created_at") or datetime.min,
        reverse=True,
    )[:limit]

    now = datetime.utcnow()
    start_of_week = now - timedelta(days=now.weekday())
    deliveries_this_week = 0
    prep_durations: list[int] = []
    total_durations: list[int] = []
    history_items = []

    for order in orders:
        items = _parse_json_items(order.get("items"))
        total_items = sum(int(item.get("cantidad", 0)) for item in items)
        tiempo_hasta_preparacion = None
        tiempo_preparacion = None
        tiempo_total = None

        created_at = order.get("created_at")
        cocinando_at = order.get("cocinando_at")
        served_at = order.get("served_at")
        entregado_at = order.get("entregado_at")
        cancelado_at = order.get("cancelado_at")

        if isinstance(created_at, str):
            try:
                created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            except ValueError:
                created_at = None
        if isinstance(cocinando_at, str):
            try:
                cocinando_at = datetime.fromisoformat(cocinando_at.replace("Z", "+00:00"))
            except ValueError:
                cocinando_at = None
        if isinstance(served_at, str):
            try:
                served_at = datetime.fromisoformat(served_at.replace("Z", "+00:00"))
            except ValueError:
                served_at = None
        if isinstance(entregado_at, str):
            try:
                entregado_at = datetime.fromisoformat(entregado_at.replace("Z", "+00:00"))
            except ValueError:
                entregado_at = None
        if isinstance(cancelado_at, str):
            try:
                cancelado_at = datetime.fromisoformat(cancelado_at.replace("Z", "+00:00"))
            except ValueError:
                cancelado_at = None

        if cocinando_at and created_at:
            tiempo_hasta_preparacion = int((cocinando_at - created_at).total_seconds())

        if cocinando_at and served_at:
            tiempo_preparacion = int((served_at - cocinando_at).total_seconds())
            prep_durations.append(tiempo_preparacion)

        if created_at and entregado_at:
            tiempo_total = int((entregado_at - created_at).total_seconds())
            total_durations.append(tiempo_total)

        if (
            order.get("tipo_pedido") == "domicilio"
            and created_at
            and created_at >= start_of_week
            and order.get("status") == OrderStatus.ENTREGADO.value
        ):
            deliveries_this_week += 1

        history_items.append(
            {
                "id": order.get("id"),
                "tipo_pedido": order.get("tipo_pedido"),
                "mesa_numero": order.get("mesa_numero"),
                "cliente_nombre": order.get("cliente_nombre"),
                "cliente_telefono": order.get("cliente_telefono"),
                "direccion_entrega": order.get("direccion_entrega"),
                "status": order.get("status"),
                "total_amount": float(order.get("total_amount") or 0),
                "created_at": created_at,
                "cocinando_at": cocinando_at,
                "served_at": served_at,
                "entregado_at": entregado_at,
                "cancelado_at": cancelado_at,
                "notas": order.get("notas"),
                "total_items": total_items,
                "tiempo_hasta_preparacion_segundos": tiempo_hasta_preparacion,
                "tiempo_preparacion_segundos": tiempo_preparacion,
                "tiempo_total_segundos": tiempo_total,
            }
        )

    return {
        "summary": {
            "total_registros": len(history_items),
            "total_domicilios_semana": deliveries_this_week,
            "tiempo_promedio_preparacion_segundos": round(sum(prep_durations) / len(prep_durations), 2)
            if prep_durations
            else 0,
            "tiempo_promedio_total_segundos": round(sum(total_durations) / len(total_durations), 2)
            if total_durations
            else 0,
        },
        "items": history_items,
    }
