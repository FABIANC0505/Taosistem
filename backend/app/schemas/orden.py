from datetime import datetime
import enum
from typing import Optional
from pydantic import BaseModel, Field, model_validator


class OrderStatus(str, enum.Enum):
    PENDIENTE = "pendiente"
    EN_PREPARACION = "en_preparacion"
    LISTO = "listo"
    ENTREGADO = "entregado"
    CANCELADO = "cancelado"


class TipoPedido:
    MESA = "mesa"
    DOMICILIO = "domicilio"


class OrderItemSchema(BaseModel):
    product_id: str
    nombre: str
    cantidad: int = Field(..., ge=1)
    precio_unitario: float = Field(..., gt=0)
    subtotal: Optional[float] = None

    @model_validator(mode="after")
    def ensure_subtotal(self):
        self.subtotal = round(float(self.cantidad) * float(self.precio_unitario), 2)
        return self


class CrearPedidoSchema(BaseModel):
    mesa_numero: Optional[int] = Field(None, ge=1, le=300)
    tipo_pedido: str = Field(default=TipoPedido.MESA, pattern="^(mesa|domicilio)$")
    cliente_nombre: Optional[str] = Field(None, max_length=150)
    cliente_telefono: Optional[str] = Field(None, max_length=30)
    direccion_entrega: Optional[str] = None
    items: list[OrderItemSchema] = Field(..., min_length=1)
    notas: Optional[str] = None

    @model_validator(mode="after")
    def validate_order_destination(self):
        if self.tipo_pedido == TipoPedido.MESA:
            if self.mesa_numero is None:
                raise ValueError("Los pedidos de mesa requieren número de mesa")
        else:
            if not self.cliente_nombre or not self.cliente_nombre.strip():
                raise ValueError("Los domicilios requieren nombre del cliente")
            if not self.cliente_telefono or not self.cliente_telefono.strip():
                raise ValueError("Los domicilios requieren teléfono del cliente")
            if not self.direccion_entrega or not self.direccion_entrega.strip():
                raise ValueError("Los domicilios requieren dirección de entrega")
        return self


class ActualizarPedidoSchema(BaseModel):
    mesa_numero: Optional[int] = Field(None, ge=1, le=300)
    tipo_pedido: Optional[str] = Field(None, pattern="^(mesa|domicilio)$")
    cliente_nombre: Optional[str] = Field(None, max_length=150)
    cliente_telefono: Optional[str] = Field(None, max_length=30)
    direccion_entrega: Optional[str] = None
    items: Optional[list[OrderItemSchema]] = Field(None, min_length=1)
    notas: Optional[str] = None


class ActualizarEstadoSchema(BaseModel):
    status: OrderStatus


class CancelarPedidoSchema(BaseModel):
    motivo_cancelacion: Optional[str] = None


class PedidoResponseSchema(BaseModel):
    id: str
    id_mesero: str
    mesa_numero: Optional[int] = None
    tipo_pedido: str = TipoPedido.MESA
    cliente_nombre: Optional[str] = None
    cliente_telefono: Optional[str] = None
    direccion_entrega: Optional[str] = None
    status: OrderStatus
    items: list[OrderItemSchema]
    notas: Optional[str] = None
    total_amount: float
    created_at: Optional[datetime] = None
    cocinando_at: Optional[datetime] = None
    served_at: Optional[datetime] = None
    entregado_at: Optional[datetime] = None
    cancelado_at: Optional[datetime] = None
    cancelado_por: Optional[str] = None
    motivo_cancelacion: Optional[str] = None

    class Config:
        from_attributes = True


class OrderHistoryEntrySchema(BaseModel):
    id: str
    tipo_pedido: str
    mesa_numero: Optional[int] = None
    cliente_nombre: Optional[str] = None
    cliente_telefono: Optional[str] = None
    direccion_entrega: Optional[str] = None
    status: OrderStatus
    total_amount: float
    created_at: Optional[datetime] = None
    cocinando_at: Optional[datetime] = None
    served_at: Optional[datetime] = None
    entregado_at: Optional[datetime] = None
    cancelado_at: Optional[datetime] = None
    notas: Optional[str] = None
    total_items: int
    tiempo_hasta_preparacion_segundos: Optional[int] = None
    tiempo_preparacion_segundos: Optional[int] = None
    tiempo_total_segundos: Optional[int] = None


class OrderHistorySummarySchema(BaseModel):
    total_registros: int
    total_domicilios_semana: int
    tiempo_promedio_preparacion_segundos: float
    tiempo_promedio_total_segundos: float


class OrderHistoryResponseSchema(BaseModel):
    summary: OrderHistorySummarySchema
    items: list[OrderHistoryEntrySchema]
