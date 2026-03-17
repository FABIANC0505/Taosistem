from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import verify_token
from app.models.orden import Order, OrderStatus
from app.models.user import User, UserRole
from app.services.history_settings import (
    cleanup_expired_dispatched_orders,
    get_history_retention_days,
)
from app.schemas.orden import (
    ActualizarEstadoSchema,
    ActualizarPedidoSchema,
    CancelarPedidoSchema,
    CrearPedidoSchema,
    PedidoResponseSchema,
)

router = APIRouter(prefix="/orders", tags=["orders"])


async def get_current_user(
    authorization: str = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
        )

    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado o inválido",
        )

    user_id = payload.get("sub")
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
        )

    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo",
        )

    return user


def order_to_response(order: Order) -> PedidoResponseSchema:
    return PedidoResponseSchema(
        id=order.id,
        id_mesero=order.id_mesero,
        mesa_numero=order.mesa_numero,
        status=order.status,
        items=order.items,
        notas=order.notas,
        total_amount=float(order.total_amount),
        created_at=order.created_at,
        cocinando_at=order.cocinando_at,
        served_at=order.served_at,
        entregado_at=order.entregado_at,
        cancelado_at=order.cancelado_at,
        cancelado_por=order.cancelado_por,
        motivo_cancelacion=order.motivo_cancelacion,
    )


def validate_order_access(current_user: User, order: Order):
    if current_user.rol == UserRole.ADMIN:
        return

    if current_user.rol == UserRole.COCINA:
        return

    if current_user.rol == UserRole.MESERO and order.id_mesero == current_user.id:
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="No tienes permiso para gestionar este pedido",
    )


def validate_order_owner_management_access(current_user: User, order: Order):
    if current_user.rol == UserRole.ADMIN:
        return

    if current_user.rol == UserRole.MESERO and order.id_mesero == current_user.id:
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="No tienes permiso para gestionar este pedido",
    )


def calculate_total(items: list[dict]) -> float:
    total = sum(float(item["cantidad"]) * float(item["precio_unitario"]) for item in items)
    return round(total, 2)


@router.get("", response_model=list[PedidoResponseSchema])
async def get_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    retention_days = await get_history_retention_days(db)
    await cleanup_expired_dispatched_orders(db, retention_days)

    stmt = select(Order).order_by(Order.created_at.desc())

    if current_user.rol == UserRole.MESERO:
        stmt = stmt.where(Order.id_mesero == current_user.id)

    result = await db.execute(stmt)
    orders = result.scalars().all()
    return [order_to_response(order) for order in orders]


@router.get("/{order_id}", response_model=PedidoResponseSchema)
async def get_order(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    validate_order_access(current_user, order)
    return order_to_response(order)


@router.post("", response_model=PedidoResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: CrearPedidoSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.rol != UserRole.MESERO and current_user.rol != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="No autorizado para crear pedidos")

    items = [item.model_dump() for item in payload.items]
    total = calculate_total(items)

    order = Order(
        id_mesero=current_user.id,
        mesa_numero=payload.mesa_numero,
        status=OrderStatus.PENDIENTE,
        items=items,
        notas=payload.notas,
        total_amount=total,
    )

    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order_to_response(order)


@router.put("/{order_id}", response_model=PedidoResponseSchema)
async def update_order(
    order_id: str,
    payload: ActualizarPedidoSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    validate_order_owner_management_access(current_user, order)

    if order.status in (OrderStatus.ENTREGADO, OrderStatus.CANCELADO):
        raise HTTPException(status_code=400, detail="No se puede editar un pedido finalizado")

    if payload.mesa_numero is not None:
        order.mesa_numero = payload.mesa_numero

    if payload.notas is not None:
        order.notas = payload.notas

    if payload.items is not None:
        items = [item.model_dump() for item in payload.items]
        order.items = items
        order.total_amount = calculate_total(items)

    await db.commit()
    await db.refresh(order)
    return order_to_response(order)


@router.put("/{order_id}/status", response_model=PedidoResponseSchema)
async def update_order_status(
    order_id: str,
    payload: ActualizarEstadoSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    validate_order_access(current_user, order)

    if current_user.rol == UserRole.COCINA and payload.status != OrderStatus.ENTREGADO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cocina solo puede marcar pedidos como entregados",
        )

    now = datetime.now(timezone.utc)
    order.status = payload.status

    if payload.status == OrderStatus.EN_PREPARACION and not order.cocinando_at:
        order.cocinando_at = now
    if payload.status == OrderStatus.LISTO and not order.served_at:
        order.served_at = now
    if payload.status == OrderStatus.ENTREGADO and not order.entregado_at:
        order.entregado_at = now

    await db.commit()
    await db.refresh(order)
    return order_to_response(order)


@router.put("/{order_id}/cancel", response_model=PedidoResponseSchema)
async def cancel_order(
    order_id: str,
    payload: CancelarPedidoSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    validate_order_owner_management_access(current_user, order)

    if order.status == OrderStatus.CANCELADO:
        return order_to_response(order)

    order.status = OrderStatus.CANCELADO
    order.cancelado_at = datetime.now(timezone.utc)
    order.cancelado_por = current_user.id
    order.motivo_cancelacion = payload.motivo_cancelacion

    await db.commit()
    await db.refresh(order)
    return order_to_response(order)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    validate_order_owner_management_access(current_user, order)

    await db.delete(order)
    await db.commit()