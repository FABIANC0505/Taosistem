from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.core.database import get_db, fetch_all, fetch_one, execute
from app.services.storage import StorageError, upload_product_image
from pydantic import BaseModel
from typing import List, Optional
from uuid import uuid4

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
async def get_products(db=Depends(get_db)):
    """Obtener todos los productos"""
    rows = await fetch_all(db, "SELECT * FROM products ORDER BY created_at DESC")
    return [
        ProductResponse(
            id=r["id"],
            nombre=r["nombre"],
            precio=float(r["precio"]),
            descripcion=r.get("descripcion"),
            categoria=r["categoria"],
            disponible=bool(r["disponible"]),
            imagen_url=r.get("imagen_url"),
            agotado_por=r.get("agotado_por"),
            agotado_at=r.get("agotado_at"),
            created_at=r.get("created_at"),
            updated_at=r.get("updated_at"),
        )
        for r in rows
    ]

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str, db=Depends(get_db)):
    """Obtener producto por ID"""
    product = await fetch_one(db, "SELECT * FROM products WHERE id = ?", (product_id,))
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return ProductResponse(
        id=product["id"],
        nombre=product["nombre"],
        precio=float(product["precio"]),
        descripcion=product.get("descripcion"),
        categoria=product["categoria"],
        disponible=bool(product["disponible"]),
        imagen_url=product.get("imagen_url"),
        agotado_por=product.get("agotado_por"),
        agotado_at=product.get("agotado_at"),
        created_at=product.get("created_at"),
        updated_at=product.get("updated_at"),
    )

@router.post("", response_model=ProductResponse)
async def create_product(
    nombre: str = Form(...),
    precio: float = Form(...),
    categoria: str = Form(...),
    descripcion: Optional[str] = Form(None),
    imagen: Optional[UploadFile] = File(None),
    db=Depends(get_db)
):
    """Crear nuevo producto"""
    
    imagen_url = None
    if imagen:
        try:
            imagen_url = await upload_product_image(imagen)
        except StorageError as exc:
            raise HTTPException(status_code=500, detail=f"Error subiendo imagen: {exc}") from exc
    
    product_id = str(uuid4())
    await execute(
        db,
        """
        INSERT INTO products (id, nombre, precio, descripcion, imagen_url, categoria, disponible)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (product_id, nombre, precio, descripcion, imagen_url, categoria, 1),
    )
    product = await fetch_one(db, "SELECT * FROM products WHERE id = ?", (product_id,))
    return ProductResponse(
        id=product["id"],
        nombre=product["nombre"],
        precio=float(product["precio"]),
        descripcion=product.get("descripcion"),
        categoria=product["categoria"],
        disponible=bool(product["disponible"]),
        imagen_url=product.get("imagen_url"),
        agotado_por=product.get("agotado_por"),
        agotado_at=product.get("agotado_at"),
        created_at=product.get("created_at"),
        updated_at=product.get("updated_at"),
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
    db=Depends(get_db)
):
    """Actualizar producto"""
    
    product = await fetch_one(db, "SELECT * FROM products WHERE id = ?", (product_id,))
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # handle image upload
    if imagen:
        try:
            imagen_url = await upload_product_image(imagen)
        except StorageError as exc:
            raise HTTPException(status_code=500, detail=f"Error subiendo imagen: {exc}") from exc
        await execute(db, "UPDATE products SET imagen_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (imagen_url, product_id))

    # build dynamic update
    updates = []
    params = []
    if nombre:
        updates.append("nombre = ?")
        params.append(nombre)
    if precio is not None:
        updates.append("precio = ?")
        params.append(precio)
    if descripcion is not None:
        updates.append("descripcion = ?")
        params.append(descripcion)
    if categoria:
        updates.append("categoria = ?")
        params.append(categoria)
    if disponible is not None:
        updates.append("disponible = ?")
        params.append(1 if disponible else 0)

    if updates:
        sql = f"UPDATE products SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        params.append(product_id)
        await execute(db, sql, tuple(params))

    product = await fetch_one(db, "SELECT * FROM products WHERE id = ?", (product_id,))
    return ProductResponse(
        id=product["id"],
        nombre=product["nombre"],
        precio=float(product["precio"]),
        descripcion=product.get("descripcion"),
        categoria=product["categoria"],
        disponible=bool(product["disponible"]),
        imagen_url=product.get("imagen_url"),
        agotado_por=product.get("agotado_por"),
        agotado_at=product.get("agotado_at"),
        created_at=product.get("created_at"),
        updated_at=product.get("updated_at"),
    )

@router.delete("/{product_id}")
async def delete_product(product_id: str, db=Depends(get_db)):
    """Eliminar producto"""
    product = await fetch_one(db, "SELECT id FROM products WHERE id = ?", (product_id,))
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    await execute(db, "DELETE FROM products WHERE id = ?", (product_id,))
    return {"detail": "Producto eliminado"}

@router.put("/{product_id}/mark-out-of-stock")
async def mark_out_of_stock(product_id: str, db=Depends(get_db)):
    """Marcar producto como agotado"""
    product = await fetch_one(db, "SELECT * FROM products WHERE id = ?", (product_id,))
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    await execute(db, "UPDATE products SET disponible = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (product_id,))
    product = await fetch_one(db, "SELECT * FROM products WHERE id = ?", (product_id,))
    return ProductResponse(
        id=product["id"],
        nombre=product["nombre"],
        precio=float(product["precio"]),
        descripcion=product.get("descripcion"),
        categoria=product["categoria"],
        disponible=bool(product["disponible"]),
        imagen_url=product.get("imagen_url"),
        agotado_por=product.get("agotado_por"),
        agotado_at=product.get("agotado_at"),
        created_at=product.get("created_at"),
        updated_at=product.get("updated_at"),
    )

@router.get("/category/{categoria}")
async def get_products_by_category(categoria: str, db=Depends(get_db)):
    """Obtener productos por categoría"""
    rows = await fetch_all(db, "SELECT * FROM products WHERE categoria = ? ORDER BY created_at DESC", (categoria,))
    return [
        ProductResponse(
            id=r["id"],
            nombre=r["nombre"],
            precio=float(r["precio"]),
            descripcion=r.get("descripcion"),
            categoria=r["categoria"],
            disponible=bool(r["disponible"]),
            imagen_url=r.get("imagen_url"),
            agotado_por=r.get("agotado_por"),
            agotado_at=r.get("agotado_at"),
            created_at=r.get("created_at"),
            updated_at=r.get("updated_at"),
        )
        for r in rows
    ]
