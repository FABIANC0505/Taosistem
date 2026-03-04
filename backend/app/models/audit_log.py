import uuid
from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_log"

    id:        Mapped[str] = mapped_column(String(36), primary_key=True,
                                           default=lambda: str(uuid.uuid4()))
    user_id:   Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    accion:    Mapped[str] = mapped_column(String(200), nullable=False)
    detalle:   Mapped[str] = mapped_column(Text, nullable=True)
    ip:        Mapped[str] = mapped_column(String(50), nullable=True)
    created_at:            = mapped_column(DateTime(timezone=True), server_default=func.now())