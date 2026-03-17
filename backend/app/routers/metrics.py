from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from app.core.database import get_db
from app.core.security import verify_token
from app.models.orden import Order, OrderStatus
from app.models.producto import Product
from app.models.user import User, UserRole
from app.services.history_settings import get_dispatched_history
from pydantic import BaseModel
from statistics import mean, mode, StatisticsError
from typing import List
from datetime import datetime, timedelta

router = APIRouter(prefix="/metrics", tags=["metrics"])


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


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.rol != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No autorizado",
        )
    return current_user


async def require_admin_or_cocina(current_user: User = Depends(get_current_user)) -> User:
    if current_user.rol not in (UserRole.ADMIN, UserRole.COCINA):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No autorizado",
        )
    return current_user


class DispatchedByDayPoint(BaseModel):
    fecha: str
    cantidad: int


class DispatchedByMonthPoint(BaseModel):
    mes: str
    cantidad: int


class DispatchedHistoryResponse(BaseModel):
    retention_days: int
    dispatched_por_dia: List[DispatchedByDayPoint]
    dispatched_por_mes: List[DispatchedByMonthPoint]

class MetricsResponse(BaseModel):
    total_ingresos: float
    total_ordenes: int
    ordenes_hoy: int
    productos_agotados: int
    producto_mas_vendido: dict
    media_ingresos: float
    moda_ingresos: float
    ingresos_por_dia: List[dict]
    productos_top: List[dict]
    dispatched_por_dia: List[DispatchedByDayPoint]
    dispatched_por_mes: List[DispatchedByMonthPoint]

@router.get("/dashboard", response_model=MetricsResponse)
async def get_dashboard_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Obtener todas las métricas del dashboard"""
    dispatched_history = await get_dispatched_history(db)
    
    # Total de ingresos
    stmt = select(func.coalesce(func.sum(Order.total_amount), 0)).where(
        Order.status.in_([OrderStatus.ENTREGADO])
    )
    result = await db.execute(stmt)
    total_ingresos = float(result.scalar())
    
    # Total de órdenes
    stmt = select(func.count(Order.id))
    result = await db.execute(stmt)
    total_ordenes = result.scalar()
    
    # Órdenes de hoy
    today = datetime.now().date()
    stmt = select(func.count(Order.id)).where(
        func.date(Order.created_at) == today
    )
    result = await db.execute(stmt)
    ordenes_hoy = result.scalar()
    
    # Productos agotados
    stmt = select(func.count(Product.id)).where(Product.disponible == False)
    result = await db.execute(stmt)
    productos_agotados = result.scalar()
    
    # Ingresos por día (últimos 30 días)
    thirty_days_ago = datetime.now() - timedelta(days=30)
    stmt = select(
        func.date(Order.created_at).label("fecha"),
        func.coalesce(func.sum(Order.total_amount), 0).label("ingresos")
    ).where(
        Order.created_at >= thirty_days_ago,
        Order.status.in_([OrderStatus.ENTREGADO])
    ).group_by(
        func.date(Order.created_at)
    ).order_by(func.date(Order.created_at))
    
    result = await db.execute(stmt)
    ingresos_por_dia = [
        {"fecha": row.fecha.isoformat(), "ingresos": float(row.ingresos)}
        for row in result.all()
    ]
    
    # Media y Moda de ingresos
    ingresos_list = [float(dia["ingresos"]) for dia in ingresos_por_dia]
    media_ingresos = mean(ingresos_list) if ingresos_list else 0.0
    try:
        moda_ingresos = float(mode(ingresos_list)) if ingresos_list else 0.0
    except StatisticsError:
        moda_ingresos = media_ingresos
    
    # Top 10 productos más vendidos (extrae de items JSONB de pedidos entregados)
    top_sql = text("""
        SELECT
            item->>'nombre' AS nombre,
            SUM((item->>'cantidad')::int) AS cantidad,
            SUM((item->>'cantidad')::float * (item->>'precio_unitario')::float) AS ingresos
        FROM orders, jsonb_array_elements(items) AS item
        WHERE status::text = 'ENTREGADO'
        GROUP BY item->>'nombre'
        ORDER BY cantidad DESC
        LIMIT 10
    """)
    result = await db.execute(top_sql)
    productos_top = [
        {
            "nombre": row.nombre,
            "cantidad": int(row.cantidad),
            "ingresos": float(row.ingresos) if row.ingresos else 0.0
        }
        for row in result.all()
    ]
    
    # Producto más vendido
    producto_mas_vendido = {"nombre": "N/A", "cantidad": 0}
    if productos_top:
        producto_mas_vendido = {
            "nombre": productos_top[0]["nombre"],
            "cantidad": productos_top[0]["cantidad"]
        }
    
    return MetricsResponse(
        total_ingresos=total_ingresos,
        total_ordenes=total_ordenes,
        ordenes_hoy=ordenes_hoy,
        productos_agotados=productos_agotados,
        producto_mas_vendido=producto_mas_vendido,
        media_ingresos=media_ingresos,
        moda_ingresos=moda_ingresos,
        ingresos_por_dia=ingresos_por_dia,
        productos_top=productos_top,
        dispatched_por_dia=dispatched_history["dispatched_por_dia"],
        dispatched_por_mes=dispatched_history["dispatched_por_mes"],
    )


@router.get("/dispatched-history", response_model=DispatchedHistoryResponse)
async def get_dispatched_orders_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_or_cocina),
):
    """Obtener historial de pedidos despachados por día y por mes"""
    history = await get_dispatched_history(db)
    return DispatchedHistoryResponse(**history)

@router.get("/income-trends")
async def get_income_trends(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Obtener tendencia de ingresos"""
    
    start_date = datetime.now() - timedelta(days=days)
    stmt = select(
        func.date(Order.created_at).label("fecha"),
        func.coalesce(func.sum(Order.total_amount), 0).label("ingresos")
    ).where(
        Order.created_at >= start_date,
        Order.status.in_([OrderStatus.ENTREGADO])
    ).group_by(
        func.date(Order.created_at)
    ).order_by(func.date(Order.created_at))
    
    result = await db.execute(stmt)
    return [
        {"fecha": row.fecha.isoformat(), "ingresos": float(row.ingresos)}
        for row in result.all()
    ]

@router.get("/top-products")
async def get_top_products(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Obtener productos más vendidos"""
    top_sql = text("""
        SELECT
            item->>'nombre' AS nombre,
            SUM((item->>'cantidad')::int) AS cantidad,
            SUM((item->>'cantidad')::float * (item->>'precio_unitario')::float) AS ingresos
        FROM orders, jsonb_array_elements(items) AS item
        WHERE status::text = 'ENTREGADO'
        GROUP BY item->>'nombre'
        ORDER BY cantidad DESC
        LIMIT :limit
    """)
    result = await db.execute(top_sql, {"limit": limit})
    return [
        {
            "nombre": row.nombre,
            "cantidad": int(row.cantidad),
            "ingresos": float(row.ingresos) if row.ingresos else 0.0
        }
        for row in result.all()
    ]

@router.get("/statistics")
async def get_statistics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Obtener estadísticas generales"""
    
    # Órdenes por estado
    stmt = select(
        Order.status,
        func.count(Order.id).label("cantidad")
    ).group_by(Order.status)
    
    result = await db.execute(stmt)
    ordenes_por_estado = {
        row.status.value: row.cantidad
        for row in result.all()
    }
    
    # Promedio de gasto por orden
    stmt = select(func.coalesce(func.avg(Order.total_amount), 0))
    result = await db.execute(stmt)
    promedio_gasto = float(result.scalar())
    
    return {
        "ordenes_por_estado": ordenes_por_estado,
        "promedio_gasto_por_orden": promedio_gasto
    }
