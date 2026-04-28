from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.producto import Product
from app.services.storage import StorageError, upload_product_image
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/products", tags=["products"])

# Schemas
class ProductBase(BaseModel):
    nombre: str
    precio: float
    descripcion: Optional[str] = None
    categoria: str
    disponible: bool = True

class ProductResponse(ProductBase):
    id: str
    imagen_url: Optional[str] = None
    agotado_por: Optional[str] = None
    agotado_at: Optional[str] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

@router.get("", response_model=List[ProductResponse])
async def get_products(db: AsyncSession = Depends(get_db)):
    """Obtener todos los productos"""
    stmt = select(Product).order_by(Product.created_at.desc())
    result = await db.execute(stmt)
    products = result.scalars().all()
    
    return [
        ProductResponse(
            id=p.id,
            nombre=p.nombre,
            precio=float(p.precio),
            descripcion=p.descripcion,
            categoria=p.categoria,
            disponible=p.disponible,
            imagen_url=p.imagen_url,
            agotado_por=p.agotado_por,
            agotado_at=p.agotado_at.isoformat() if p.agotado_at else None,
            created_at=p.created_at.isoformat() if p.created_at else None,
            updated_at=p.updated_at.isoformat() if p.updated_at else None,
        )
        for p in products
    ]

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str, db: AsyncSession = Depends(get_db)):
    """Obtener producto por ID"""
    stmt = select(Product).where(Product.id == product_id)
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    return ProductResponse(
        id=product.id,
        nombre=product.nombre,
        precio=float(product.precio),
        descripcion=product.descripcion,
        categoria=product.categoria,
        disponible=product.disponible,
        imagen_url=product.imagen_url,
        agotado_por=product.agotado_por,
        agotado_at=product.agotado_at.isoformat() if product.agotado_at else None,
        created_at=product.created_at.isoformat() if product.created_at else None,
        updated_at=product.updated_at.isoformat() if product.updated_at else None,
    )

@router.post("", response_model=ProductResponse)
async def create_product(
    nombre: str = Form(...),
    precio: float = Form(...),
    categoria: str = Form(...),
    descripcion: Optional[str] = Form(None),
    imagen: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db)
):
    """Crear nuevo producto"""
    
    imagen_url = None
    if imagen:
        try:
            imagen_url = await upload_product_image(imagen)
        except StorageError as exc:
            raise HTTPException(status_code=500, detail=f"Error subiendo imagen: {exc}") from exc
    
    new_product = Product(
        nombre=nombre,
        precio=precio,
        descripcion=descripcion,
        categoria=categoria,
        disponible=True,
        imagen_url=imagen_url
    )
    
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)
    
    return ProductResponse(
        id=new_product.id,
        nombre=new_product.nombre,
        precio=float(new_product.precio),
        descripcion=new_product.descripcion,
        categoria=new_product.categoria,
        disponible=new_product.disponible,
        imagen_url=new_product.imagen_url,
        agotado_por=new_product.agotado_por,
        agotado_at=new_product.agotado_at.isoformat() if new_product.agotado_at else None,
        created_at=new_product.created_at.isoformat() if new_product.created_at else None,
        updated_at=new_product.updated_at.isoformat() if new_product.updated_at else None,
    )

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    nombre: Optional[str] = Form(None),
    precio: Optional[float] = Form(None),
    categoria: Optional[str] = Form(None),
    descripcion: Optional[str] = Form(None),
    disponible: Optional[bool] = Form(None),
    imagen: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db)
):
    """Actualizar producto"""
    
    stmt = select(Product).where(Product.id == product_id)
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    if nombre:
        product.nombre = nombre
    if precio is not None:
        product.precio = precio
    if descripcion is not None:
        product.descripcion = descripcion
    if categoria:
        product.categoria = categoria
    if disponible is not None:
        product.disponible = disponible
    if imagen:
        try:
            product.imagen_url = await upload_product_image(imagen)
        except StorageError as exc:
            raise HTTPException(status_code=500, detail=f"Error subiendo imagen: {exc}") from exc
    
    await db.commit()
    await db.refresh(product)
    
    return ProductResponse(
        id=product.id,
        nombre=product.nombre,
        precio=float(product.precio),
        descripcion=product.descripcion,
        categoria=product.categoria,
        disponible=product.disponible,
        imagen_url=product.imagen_url,
        agotado_por=product.agotado_por,
        agotado_at=product.agotado_at.isoformat() if product.agotado_at else None,
        created_at=product.created_at.isoformat() if product.created_at else None,
        updated_at=product.updated_at.isoformat() if product.updated_at else None,
    )

@router.delete("/{product_id}")
async def delete_product(product_id: str, db: AsyncSession = Depends(get_db)):
    """Eliminar producto"""
    
    stmt = select(Product).where(Product.id == product_id)
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    await db.delete(product)
    await db.commit()
    
    return {"detail": "Producto eliminado"}

@router.put("/{product_id}/mark-out-of-stock")
async def mark_out_of_stock(product_id: str, db: AsyncSession = Depends(get_db)):
    """Marcar producto como agotado"""
    
    stmt = select(Product).where(Product.id == product_id)
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    product.disponible = False
    await db.commit()
    await db.refresh(product)
    
    return ProductResponse(
        id=product.id,
        nombre=product.nombre,
        precio=float(product.precio),
        descripcion=product.descripcion,
        categoria=product.categoria,
        disponible=product.disponible,
        imagen_url=product.imagen_url,
        agotado_por=product.agotado_por,
        agotado_at=product.agotado_at.isoformat() if product.agotado_at else None,
        created_at=product.created_at.isoformat() if product.created_at else None,
        updated_at=product.updated_at.isoformat() if product.updated_at else None,
    )

@router.get("/category/{categoria}")
async def get_products_by_category(categoria: str, db: AsyncSession = Depends(get_db)):
    """Obtener productos por categoría"""
    stmt = select(Product).where(Product.categoria == categoria)
    result = await db.execute(stmt)
    products = result.scalars().all()
    
    return [
        ProductResponse(
            id=p.id,
            nombre=p.nombre,
            precio=float(p.precio),
            descripcion=p.descripcion,
            categoria=p.categoria,
            disponible=p.disponible,
            imagen_url=p.imagen_url,
            agotado_por=p.agotado_por,
            agotado_at=p.agotado_at.isoformat() if p.agotado_at else None,
            created_at=p.created_at.isoformat() if p.created_at else None,
            updated_at=p.updated_at.isoformat() if p.updated_at else None,
        )
        for p in products
    ]
