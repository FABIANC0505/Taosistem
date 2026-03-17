from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import create_access_token, verify_token, hash_password
from app.models.user import User, UserRole
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/users", tags=["users"])

async def get_current_user(
    authorization: str = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    """Obtener usuario actual desde el token JWT"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token inválido")
    
    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Token expirado o inválido")
    
    user_id = payload.get("sub")
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    if not user.activo:
        raise HTTPException(status_code=403, detail="Usuario inactivo")
    
    return user


async def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.rol != UserRole.ADMIN:
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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Obtener todos los usuarios"""
    stmt = select(User).order_by(User.created_at.desc())
    result = await db.execute(stmt)
    users = result.scalars().all()
    
    return [
        UserResponse(
            id=u.id,
            nombre=u.nombre,
            email=u.email,
            rol=u.rol,
            activo=u.activo,
            created_at=u.created_at.isoformat() if u.created_at else None,
            updated_at=u.updated_at.isoformat() if u.updated_at else None,
        )
        for u in users
    ]

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Obtener usuario por ID"""
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return UserResponse(
        id=user.id,
        nombre=user.nombre,
        email=user.email,
        rol=user.rol,
        activo=user.activo,
        created_at=user.created_at.isoformat() if user.created_at else None,
        updated_at=user.updated_at.isoformat() if user.updated_at else None,
    )

@router.post("", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Crear nuevo usuario"""
    
    # Verificar si email existe
    stmt = select(User).where(User.email == user_data.email)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email ya existe")
    
    new_user = User(
        nombre=user_data.nombre,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        rol=user_data.rol,
        activo=True
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return UserResponse(
        id=new_user.id,
        nombre=new_user.nombre,
        email=new_user.email,
        rol=new_user.rol,
        activo=new_user.activo,
        created_at=new_user.created_at.isoformat() if new_user.created_at else None,
        updated_at=new_user.updated_at.isoformat() if new_user.updated_at else None,
    )

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Actualizar usuario"""
    
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if user_data.nombre:
        user.nombre = user_data.nombre
    if user_data.email:
        user.email = user_data.email
    if user_data.rol:
        user.rol = user_data.rol
    if user_data.activo is not None:
        user.activo = user_data.activo
    
    await db.commit()
    await db.refresh(user)
    
    return UserResponse(
        id=user.id,
        nombre=user.nombre,
        email=user.email,
        rol=user.rol,
        activo=user.activo,
        created_at=user.created_at.isoformat() if user.created_at else None,
        updated_at=user.updated_at.isoformat() if user.updated_at else None,
    )

@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Eliminar usuario"""
    
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    await db.delete(user)
    await db.commit()
    
    return {"detail": "Usuario eliminado"}

@router.put("/{user_id}/role")
async def update_user_role(
    user_id: str,
    rol: UserRole,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Actualizar rol de usuario"""
    
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    user.rol = rol
    await db.commit()
    await db.refresh(user)
    
    return UserResponse(
        id=user.id,
        nombre=user.nombre,
        email=user.email,
        rol=user.rol,
        activo=user.activo,
        created_at=user.created_at.isoformat() if user.created_at else None,
        updated_at=user.updated_at.isoformat() if user.updated_at else None,
    )

@router.put("/{user_id}/deactivate")
async def deactivate_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Desactivar usuario"""
    
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    user.activo = False
    await db.commit()
    await db.refresh(user)
    
    return UserResponse(
        id=user.id,
        nombre=user.nombre,
        email=user.email,
        rol=user.rol,
        activo=user.activo,
        created_at=user.created_at.isoformat() if user.created_at else None,
        updated_at=user.updated_at.isoformat() if user.updated_at else None,
    )
