from fastapi import APIRouter, Depends, HTTPException, status, Header
from app.core.database import get_db, fetch_one, fetch_all, execute
from app.core.security import hash_password, verify_password, create_access_token
from pydantic import BaseModel
from typing import Optional
from uuid import uuid4
import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MESERO = "mesero"
    COCINA = "cocina"
    CAJERO = "cajero"

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    nombre: str
    email: str
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

    class Config:
        from_attributes = True

@router.post("/login", response_model=AuthResponse)
async def login(credentials: LoginRequest, db=Depends(get_db)):
    """Autenticar usuario y obtener token JWT"""
    # Buscar usuario por email
    user = await fetch_one(db, "SELECT * FROM users WHERE email = ?", (credentials.email,))

    # Verificar credenciales
    if not user or not verify_password(credentials.password, user.get("password_hash")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    if not user.get("activo"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )
    
    # Crear token
    access_token = create_access_token({"sub": user.get("id"), "email": user.get("email")})
    
    return AuthResponse(
        access_token=access_token,
        user={
            "id": user.get("id"),
            "nombre": user.get("nombre"),
            "email": user.get("email"),
            "rol": user.get("rol"),
            "activo": bool(user.get("activo")),
            "created_at": user.get("created_at"),
            "updated_at": user.get("updated_at"),
        }
    )

@router.post("/register", response_model=AuthResponse)
async def register(data: RegisterRequest, db=Depends(get_db)):
    """Registrar nuevo usuario (solo para primeros registros o admin)"""
    # Verificar si ya existe
    existing = await fetch_one(db, "SELECT id FROM users WHERE email = ?", (data.email,))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email ya registrado"
        )

    # Crear usuario como ADMIN si es el primero
    count = await fetch_one(db, "SELECT COUNT(1) as c FROM users")
    existing_users = count.get("c", 0) if count else 0
    rol = UserRole.ADMIN.value if existing_users == 0 else UserRole.MESERO.value

    user_id = str(uuid4())
    password_hash = hash_password(data.password)

    await execute(
        db,
        "INSERT INTO users (id, nombre, email, password_hash, rol, activo) VALUES (?, ?, ?, ?, ?, ?)",
        (user_id, data.nombre, data.email, password_hash, rol, 1),
    )

    user = await fetch_one(db, "SELECT * FROM users WHERE id = ?", (user_id,))

    # Crear token
    access_token = create_access_token({"sub": user.get("id"), "email": user.get("email")})

    return AuthResponse(
        access_token=access_token,
        user={
            "id": user.get("id"),
            "nombre": user.get("nombre"),
            "email": user.get("email"),
            "rol": user.get("rol"),
            "activo": bool(user.get("activo")),
            "created_at": user.get("created_at"),
            "updated_at": user.get("updated_at"),
        }
    )
