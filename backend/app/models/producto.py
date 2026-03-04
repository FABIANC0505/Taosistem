import uuid
from sqlalchemy import String, Boolean, Numeric, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id:          Mapped[str]   = mapped_column(String(36), primary_key=True,
                                               default=lambda: str(uuid.uuid4()))
    nombre:      Mapped[str]   = mapped_column(String(200), nullable=False)
    precio:      Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    descripcion: Mapped[str]   = mapped_column(Text, nullable=True)
    imagen_url:  Mapped[str]   = mapped_column(String(500), nullable=True)
    categoria:   Mapped[str]   = mapped_column(String(100), nullable=False)
    disponible:  Mapped[bool]  = mapped_column(Boolean, default=True)

    # Trazabilidad de agotados (RF7)
    agotado_por: Mapped[str]   = mapped_column(String(36), ForeignKey("users.id"),
                                               nullable=True)
    agotado_at:                = mapped_column(DateTime(timezone=True), nullable=True)

    created_at:                = mapped_column(DateTime(timezone=True),
                                               server_default=func.now())
    updated_at:                = mapped_column(DateTime(timezone=True),
                                               server_default=func.now(),
                                               onupdate=func.now())