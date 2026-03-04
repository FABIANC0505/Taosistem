import uuid
import enum
from sqlalchemy import String, Boolean, Enum as SAEnum, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from app.core.database import Base


class UserRole(str, enum.Enum):
    admin  = "admin"
    mesero = "mesero"
    cocina = "cocina"


class User(Base):
    __tablename__ = "users"

    id:            Mapped[str]      = mapped_column(String(36), primary_key=True,
                                                    default=lambda: str(uuid.uuid4()))
    nombre:        Mapped[str]      = mapped_column(String(100), nullable=False)
    email:         Mapped[str]      = mapped_column(String(200), unique=True,
                                                    nullable=False, index=True)
    password_hash: Mapped[str]      = mapped_column(String(255), nullable=False)
    rol:           Mapped[UserRole] = mapped_column(SAEnum(UserRole), nullable=False)
    activo:        Mapped[bool]     = mapped_column(Boolean, default=True)
    created_at:                     = mapped_column(DateTime(timezone=True),
                                                    server_default=func.now())
    updated_at:                     = mapped_column(DateTime(timezone=True),
                                                    server_default=func.now(),
                                                    onupdate=func.now())