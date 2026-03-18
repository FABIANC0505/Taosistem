#!/usr/bin/env python3
"""
Script to seed database with test users and products.
Run this before starting the backend.
"""

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.producto import Product


async def seed_database():
    """Create tables and insert test data"""
    
    # Create async engine
    engine = create_async_engine(
        settings.database_url,
        echo=False,
    )
    
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create session factory
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            # Create test users
            users = [
                User(
                    nombre="Admin",
                    email="admin@restaurante.com",
                    password_hash=hash_password("admin123"),
                    rol=UserRole.ADMIN,
                    activo=True,
                ),
                User(
                    nombre="Juan Mesero",
                    email="mesero@restaurante.com",
                    password_hash=hash_password("mesero123"),
                    rol=UserRole.MESERO,
                    activo=True,
                ),
                User(
                    nombre="Chef Cocina",
                    email="cocina@restaurante.com",
                    password_hash=hash_password("cocina123"),
                    rol=UserRole.COCINA,
                    activo=True,
                ),
            ]
            
            for user in users:
                session.add(user)
            
            # Create test products
            products = [
                Product(
                    nombre="Pizza Personal",
                    descripcion="Pizza con mozzarella y tomate",
                    precio=30.00,
                    categoria="pizzas",
                    disponible=True,
                ),
                Product(
                    nombre="Ensalada Cesar",
                    descripcion="Ensalada fresca con aderezos",
                    precio=18.00,
                    categoria="ensaladas",
                    disponible=True,
                ),
                Product(
                    nombre="Hamburguesa",
                    descripcion="Hamburguesa con queso y carnes premium",
                    precio=25.00,
                    categoria="burgers",
                    disponible=True,
                ),
                Product(
                    nombre="Bebida Gaseosa",
                    descripcion="Refresco frio",
                    precio=5.00,
                    categoria="bebidas",
                    disponible=True,
                ),
            ]
            
            for product in products:
                session.add(product)
            
            await session.commit()
            print("✅ Database seeded successfully!")
            print("Test users created:")
            print("  - admin@restaurante.com / admin123 (ADMIN)")
            print("  - mesero@restaurante.com / mesero123 (MESERO)")
            print("  - cocina@restaurante.com / cocina123 (COCINA)")
            print("\n4 test products created (Pizza, Ensalada, Hamburguesa, Bebida)")
            
        except Exception as e:
            print(f"❌ Error seeding database: {e}")
            await session.rollback()
            raise
    
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_database())
