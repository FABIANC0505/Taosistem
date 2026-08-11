import re
import enum
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, field_validator

from app.core.database import execute, fetch_one, get_db
from app.core.security import create_access_token, hash_password, verify_password


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MESERO = "mesero"
    COCINA = "cocina"
    CAJERO = "cajero"

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value.strip()) < 4:
            raise ValueError("La contraseña debe tener al menos 4 caracteres")
        return value


class RegisterRequest(BaseModel):
    nombre: str
    email: EmailStr
    password: str

    @field_validator("nombre")
    @classmethod
    def validate_name(cls, value: str) -> str:
        if len(value.strip()) < 2:
            raise ValueError("El nombre debe tener al menos 2 caracteres")
        return value.strip()

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value.strip()) < 4:
            raise ValueError("La contraseña debe tener al menos 4 caracteres")
        return value

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

    class Config:
        from_attributes = True

@router.post("/login", response_model=AuthResponse)
async def login(credentials: LoginRequest, db=Depends(get_db)):
    """Autenticar usuario y obtener token JWT"""
    normalized_email = str(credentials.email).lower().strip()
    user = await fetch_one(db, "SELECT * FROM users WHERE email = ?", (normalized_email,))

    # Si no existe admin@restaurante.com o la BD no tiene usuarios, crearlo automáticamente
    if not user:
        if normalized_email == "admin@restaurante.com":
            user_id = str(uuid4())
            password_hash = hash_password("admin123")
            await execute(
                db,
                "INSERT INTO users (id, nombre, email, password_hash, rol, activo) VALUES (?, ?, ?, ?, ?, ?)",
                (user_id, "Administrador Demo", normalized_email, password_hash, UserRole.ADMIN.value, 1),
            )
            user = await fetch_one(db, "SELECT * FROM users WHERE email = ?", (normalized_email,))
        else:
            count = await fetch_one(db, "SELECT COUNT(1) as c FROM users")
            total_users = list(count.values())[0] if count else 0
            if total_users == 0:
                user_id = str(uuid4())
                password_hash = hash_password(credentials.password)
                await execute(
                    db,
                    "INSERT INTO users (id, nombre, email, password_hash, rol, activo) VALUES (?, ?, ?, ?, ?, ?)",
                    (user_id, "Administrador Inicial", normalized_email, password_hash, UserRole.ADMIN.value, 1),
                )
                user = await fetch_one(db, "SELECT * FROM users WHERE email = ?", (normalized_email,))

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
    normalized_email = str(data.email).lower().strip()
    existing = await fetch_one(db, "SELECT id FROM users WHERE email = ?", (normalized_email,))
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
        (user_id, data.nombre.strip(), normalized_email, password_hash, rol, 1),
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
