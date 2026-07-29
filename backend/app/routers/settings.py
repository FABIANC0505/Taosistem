from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field
import enum
from app.core.database import get_db, fetch_one
from app.core.security import verify_token
from app.services.history_settings import (
    get_history_retention_days,
    set_history_retention_days,
)

router = APIRouter(prefix="/settings", tags=["settings"])


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MESERO = "mesero"
    COCINA = "cocina"
    CAJERO = "cajero"


async def get_current_user(
    authorization: str = Header(default=None),
    db=Depends(get_db),
) -> dict:
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
    user = await fetch_one(db, "SELECT * FROM users WHERE id = ?", (user_id,))

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
        )

    if not user.get("activo"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo",
        )

    return user


async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("rol") != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No autorizado",
        )
    return current_user


class HistoryRetentionResponse(BaseModel):
    retention_days: int


class UpdateHistoryRetentionRequest(BaseModel):
    retention_days: int = Field(..., ge=1, le=3650)


@router.get("/history-retention", response_model=HistoryRetentionResponse)
async def get_history_retention(
    db=Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    retention_days = await get_history_retention_days(db)
    return HistoryRetentionResponse(retention_days=retention_days)


@router.put("/history-retention", response_model=HistoryRetentionResponse)
async def update_history_retention(
    payload: UpdateHistoryRetentionRequest,
    db=Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    retention_days = await set_history_retention_days(db, payload.retention_days)
    return HistoryRetentionResponse(retention_days=retention_days)
