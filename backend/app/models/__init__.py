# Importar todos los modelos para que Alembic los detecte automáticamente
from app.models.user import User, UserRole
from app.models.product import Product
from app.models.order import Order, OrderStatus
from app.models.audit_log import AuditLog

__all__ = ["User", "UserRole", "Product", "Order", "OrderStatus", "AuditLog"]