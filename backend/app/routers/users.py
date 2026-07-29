import enum
from uuid import uuid4
from typing import List

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, EmailStr, field_validator

from app.core.database import execute, fetch_all, fetch_one, get_db
from app.core.security import hash_password, verify_token


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MESERO = "mesero"
    COCINA = "cocina"
    CAJERO = "cajero"

router = APIRouter(prefix="/users", tags=["users"])


class UserContext(dict):
    def __getattr__(self, name: str):
        try:
            return self[name]
        except KeyError as exc:
            raise AttributeError(name) from exc

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

    if not user.get("activo"):
        raise HTTPException(status_code=403, detail="Usuario inactivo")
    
    return UserContext(user)


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
    email: EmailStr
    password: str
    rol: UserRole

    @field_validator("nombre")
    @classmethod
    def validate_name(cls, value: str) -> str:
        if len(value.strip()) < 2:
            raise ValueError("El nombre debe tener al menos 2 caracteres")
        return value.strip()

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value.strip()) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres")
        return value

class UserUpdate(BaseModel):
    nombre: str | None = None
    email: EmailStr | None = None
    rol: UserRole | None = None
    activo: bool | None = None

    @field_validator("nombre")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if len(value.strip()) < 2:
            raise ValueError("El nombre debe tener al menos 2 caracteres")
        return value.strip()

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
    normalized_email = str(user_data.email).lower().strip()
    existing = await fetch_one(db, "SELECT id FROM users WHERE email = ?", (normalized_email,))
    if existing:
        raise HTTPException(status_code=400, detail="Email ya existe")

    user_id = str(uuid4())
    password_hash = hash_password(user_data.password)
    await execute(
        db,
        "INSERT INTO users (id, nombre, email, password_hash, rol, activo) VALUES (?, ?, ?, ?, ?, ?)",
        (user_id, user_data.nombre.strip(), normalized_email, password_hash, user_data.rol.value, 1),
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
    if user.get("rol") == UserRole.ADMIN.value and user_id == current_user.get("id") and user_data.activo is False:
        raise HTTPException(status_code=400, detail="No puedes desactivar tu propio usuario administrador")

    updates = []
    params = []
    if user_data.nombre:
        updates.append("nombre = ?")
        params.append(user_data.nombre)
    if user_data.email:
        updates.append("email = ?")
        params.append(str(user_data.email).lower().strip())
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
    user = await fetch_one(db, "SELECT id, rol FROM users WHERE id = ?", (user_id,))
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.get("rol") == UserRole.ADMIN.value:
        raise HTTPException(status_code=400, detail="No puedes eliminar un usuario administrador")
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
    if user.get("id") == current_user.get("id"):
        raise HTTPException(status_code=400, detail="No puedes desactivar tu propio usuario")
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
