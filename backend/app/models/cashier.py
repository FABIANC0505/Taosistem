import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Numeric, String, Text, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class CashMovementType(str, enum.Enum):
    SALIDA = "salida"
    SERVICIO_CANCELADO = "servicio_cancelado"
    PAGO_PRODUCTO = "pago_producto"
    OTRO = "otro"


class PaymentMethod(str, enum.Enum):
    EFECTIVO = "efectivo"
    TRANSFERENCIA = "transferencia"
    TARJETA = "tarjeta"
    NEQUI = "nequi"
    DAVIPLATA = "daviplata"
    OTRO = "otro"


class CashSession(Base):
    __tablename__ = "cash_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    cashier_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    opening_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    opening_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    opened_at: Mapped[datetime] = mapped_column(DateTime(), server_default=func.now())
    closing_counted_amount: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    closing_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(), nullable=True)


class CashMovement(Base):
    __tablename__ = "cash_movements"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("cash_sessions.id"), nullable=False, index=True)
    cashier_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    movement_type: Mapped[CashMovementType] = mapped_column(
        SAEnum(CashMovementType, native_enum=False, values_callable=lambda values: [item.value for item in values]),
        nullable=False,
    )
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    related_order_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("orders.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(), server_default=func.now())


class CashPayment(Base):
    __tablename__ = "cash_payments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("cash_sessions.id"), nullable=False, index=True)
    cashier_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    order_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("orders.id"), nullable=True, index=True)
    mesa_numero: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    payment_method: Mapped[PaymentMethod] = mapped_column(
        SAEnum(PaymentMethod, native_enum=False, values_callable=lambda values: [item.value for item in values]),
        nullable=False,
    )
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    reference_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(), server_default=func.now())


class WaiterAlert(Base):
    __tablename__ = "waiter_alerts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    mesa_numero: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    cashier_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    mesero_user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(), server_default=func.now())
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(), nullable=True)
