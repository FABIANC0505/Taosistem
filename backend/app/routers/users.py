from fastapi import APIRouter, Depends, Header, HTTPException, status
from app.core.database import get_db, fetch_one, fetch_all, execute
from app.core.security import create_access_token, verify_token, hash_password
from pydantic import BaseModel
from typing import List, Optional
from uuid import uuid4
import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MESERO = "mesero"
    COCINA = "cocina"
    CAJERO = "cajero"

router = APIRouter(prefix="/users", tags=["users"])

async def get_current_user(
    authorization: str = Header(default=None),
    db=Depends(get_db),
):
    """Obtener usuario actual desde el token JWT"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token inválido")
    
    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Token expirado o inválido")
    
    user_id = payload.get("sub")
    user = await fetch_one(db, "SELECT * FROM users WHERE id = ?", (user_id,))
    
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    if not user.activo:
        raise HTTPException(status_code=403, detail="Usuario inactivo")
    
    return user


async def require_admin(current_user = Depends(get_current_user)):
    if current_user.get("rol") != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="No autorizado")
    return current_user

# Schemas
class UserBase(BaseModel):
    nombre: str
    email: str
    rol: UserRole
    activo: bool

class UserCreate(BaseModel):
    nombre: str
    email: str
    password: str
    rol: UserRole

class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[str] = None
    rol: Optional[UserRole] = None
    activo: Optional[bool] = None

class UserResponse(UserBase):
    id: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

@router.get("", response_model=List[UserResponse])
async def get_users(
    db=Depends(get_db),
    current_user = Depends(require_admin),
):
    """Obtener todos los usuarios"""
    rows = await fetch_all(db, "SELECT * FROM users ORDER BY created_at DESC")
    return [
        UserResponse(
            id=r["id"],
            nombre=r["nombre"],
            email=r["email"],
            rol=r["rol"],
            activo=bool(r["activo"]),
            created_at=r.get("created_at"),
            updated_at=r.get("updated_at"),
        )
        for r in rows
    ]

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db=Depends(get_db),
    current_user = Depends(require_admin),
):
    """Obtener usuario por ID"""
    user = await fetch_one(db, "SELECT * FROM users WHERE id = ?", (user_id,))
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return UserResponse(
        id=user["id"],
        nombre=user["nombre"],
        email=user["email"],
        rol=user["rol"],
        activo=bool(user["activo"]),
        created_at=user.get("created_at"),
        updated_at=user.get("updated_at"),
    )

@router.post("", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    db=Depends(get_db),
    current_user = Depends(require_admin),
):
    """Crear nuevo usuario"""
    # Verificar si email existe
    existing = await fetch_one(db, "SELECT id FROM users WHERE email = ?", (user_data.email,))
    if existing:
        raise HTTPException(status_code=400, detail="Email ya existe")

    user_id = str(uuid4())
    password_hash = hash_password(user_data.password)
    await execute(
        db,
        "INSERT INTO users (id, nombre, email, password_hash, rol, activo) VALUES (?, ?, ?, ?, ?, ?)",
        (user_id, user_data.nombre, user_data.email, password_hash, user_data.rol.value, 1),
    )

    user = await fetch_one(db, "SELECT * FROM users WHERE id = ?", (user_id,))
    return UserResponse(
        id=user["id"],
        nombre=user["nombre"],
        email=user["email"],
        rol=user["rol"],
        activo=bool(user["activo"]),
        created_at=user.get("created_at"),
        updated_at=user.get("updated_at"),
    )

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    db=Depends(get_db),
    current_user = Depends(require_admin),
):
    """Actualizar usuario"""
    user = await fetch_one(db, "SELECT * FROM users WHERE id = ?", (user_id,))
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    updates = []
    params = []
    if user_data.nombre:
        updates.append("nombre = ?")
        params.append(user_data.nombre)
    if user_data.email:
        updates.append("email = ?")
        params.append(user_data.email)
    if user_data.rol:
        updates.append("rol = ?")
        params.append(user_data.rol.value)
    if user_data.activo is not None:
        updates.append("activo = ?")
        params.append(1 if user_data.activo else 0)

    if updates:
        sql = f"UPDATE users SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        params.append(user_id)
        await execute(db, sql, tuple(params))

    user = await fetch_one(db, "SELECT * FROM users WHERE id = ?", (user_id,))
    return UserResponse(
        id=user["id"],
        nombre=user["nombre"],
        email=user["email"],
        rol=user["rol"],
        activo=bool(user["activo"]),
        created_at=user.get("created_at"),
        updated_at=user.get("updated_at"),
    )

@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    db=Depends(get_db),
    current_user = Depends(require_admin),
):
    """Eliminar usuario"""
    user = await fetch_one(db, "SELECT id FROM users WHERE id = ?", (user_id,))
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    await execute(db, "DELETE FROM users WHERE id = ?", (user_id,))
    return {"detail": "Usuario eliminado"}

@router.put("/{user_id}/role")
async def update_user_role(
    user_id: str,
    rol: UserRole,
    db=Depends(get_db),
    current_user = Depends(require_admin),
):
    """Actualizar rol de usuario"""
    user = await fetch_one(db, "SELECT * FROM users WHERE id = ?", (user_id,))
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    await execute(db, "UPDATE users SET rol = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (rol.value, user_id))
    user = await fetch_one(db, "SELECT * FROM users WHERE id = ?", (user_id,))
    return UserResponse(
        id=user["id"],
        nombre=user["nombre"],
        email=user["email"],
        rol=user["rol"],
        activo=bool(user["activo"]),
        created_at=user.get("created_at"),
        updated_at=user.get("updated_at"),
    )

@router.put("/{user_id}/deactivate")
async def deactivate_user(
    user_id: str,
    db=Depends(get_db),
    current_user = Depends(require_admin),
):
    """Desactivar usuario"""
    user = await fetch_one(db, "SELECT * FROM users WHERE id = ?", (user_id,))
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    await execute(db, "UPDATE users SET activo = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (user_id,))
    user = await fetch_one(db, "SELECT * FROM users WHERE id = ?", (user_id,))
    return UserResponse(
        id=user["id"],
        nombre=user["nombre"],
        email=user["email"],
        rol=user["rol"],
        activo=bool(user["activo"]),
        created_at=user.get("created_at"),
        updated_at=user.get("updated_at"),
    )
