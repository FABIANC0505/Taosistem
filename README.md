# RestauTech - Sistema de Gestión de Restaurante

Sistema completo para restaurantes con **tres paneles diferenciados por rol**: administración, meseros y cocina. Incluye gestión de pedidos en tiempo real, dashboard con métricas y control de usuarios/productos.

**Tech Stack:** FastAPI + React + TypeScript + PostgreSQL + Redis

---

## ⚡ Inicio Rápido (Pick One)

### Opción A: Usar Docker (Recomendado - 1 Comando)
```powershell
.\start-docker.ps1
```
✅ Todo automático | ❌ Requiere Docker Desktop

### Opción B: Desarrollo Local (Python + Node.js)
```powershell
.\start-dev.ps1
```
✅ Control total | ❌ Requiere PostgreSQL local

### Opción C: Solo Backend en Docker (nuevo)
```powershell
.\start-backend.ps1
```
✅ Desacoplado del frontend | ✅ Ideal para despliegue API

### Opción D: Setup Manual
```powershell
# 1. Crear BD (primera vez)
.\setup-db.ps1

# 2. Backend
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 3. Frontend (nueva ventana)
cd frontend
npm install
npm run dev
```

---

## 📍 Acceso Después de Iniciar

| Componente | URL | Notas |
|-----------|-----|-------|
| **Frontend** | http://localhost:3000 | Panel según rol |
| **Backend API** | http://localhost:8000 | API REST |
| **API Docs** | http://localhost:8000/docs | Swagger UI |
| **pgAdmin** | http://localhost:5050 | (Solo Docker) |

> Si usas `start-backend.ps1`, se levantan únicamente API + PostgreSQL + Redis.

**Credenciales por rol:**

| Rol | Redirección | Permisos |
|-----|-------------|----------|
| `admin` | `/admin` | Panel completo: usuarios, productos, métricas |
| `mesero` | `/mesero/pedidos` | Crear/editar/cancelar sus pedidos |
| `cocina` | `/cocina/pedidos` | Ver todos los pedidos, marcar como entregado |

> ℹ️ El primer usuario registrado puede ser promovido a admin desde `/admin/usuarios`.

---

## 🎯 Características Principales

✅ **Panel Admin — Dashboard Interactivo**
- 4 KPI cards (ingresos totales, órdenes, productos agotados, top producto)
- Gráfico de tendencia de ingresos (últimos 30 días)
- Top 10 productos más vendidos calculado de items reales por pedido
- Cálculo automático de media y moda de ingresos
- Historial de pedidos despachados día a día y mes a mes

✅ **Panel Admin — Gestión de Usuarios**
- CRUD completo con roles: `admin`, `mesero`, `cocina`
- Cambio de rol y activar/desactivar usuarios

✅ **Panel Admin — Gestión de Productos**
- CRUD con upload de imágenes
- Marcar como agotado, filtrar por categoría

✅ **Panel Mesero — Pedidos**
- Crear pedidos con ítems, cantidades y notas por mesa
- Editar pedidos en curso
- Cancelar pedidos con motivo
- Ver historial de pedidos propios

✅ **Panel Cocina — Órdenes en Tiempo Real**
- Visualización de todos los pedidos activos (pendiente / en preparación / listo)
- Recarga automática cada 10 segundos
- Marcar pedidos como entregado con un clic
- Permisos restringidos: no puede editar, cancelar ni eliminar pedidos
- Visualización de historial de pedidos despachados (día/mes)

✅ **Control de Acceso por Rol (RBAC)**
- JWT tokens con expiración configurable
- Rutas protegidas en frontend por `requiredRole`
- Validación en backend: mesero solo gestiona sus pedidos, cocina solo entrega
- Redirección automática al panel correspondiente tras login

✅ **Descuentos & Configuración**
- Códigos de descuento con porcentajes personalizables
- Nombre, horarios, impuestos y moneda del restaurante
- Retención configurable del historial de pedidos despachados (limpieza automática)

---

## 📁 Estructura del Proyecto

```
taosistem_backend/
├── backend/
│   ├── app/
│   │   ├── core/          # Configuración, BD, Redis, JWT
│   │   ├── models/        # Modelos SQLAlchemy (User, Order, Product)
│   │   ├── routers/       # Endpoints API
│   │   │   ├── auth.py        # Registro y login
│   │   │   ├── users.py       # Gestión de usuarios (admin)
│   │   │   ├── products.py    # Gestión de productos
│   │   │   ├── orders.py      # Pedidos con RBAC por rol
│   │   │   └── metrics.py     # Dashboard metrics con JSONB
│   │   ├── schemas/       # Esquemas Pydantic
│   │   └── services/      # Lógica de negocio
│   ├── alembic/           # Migraciones de BD
│   ├── uploads/           # Imágenes de productos
│   ├── main.py            # Punto de entrada
│   ├── requirements.txt   # Dependencias Python
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminLayout.tsx      # Layout panel admin
│   │   │   ├── MeseroLayout.tsx     # Layout panel mesero
│   │   │   ├── CocinaLayout.tsx     # Layout panel cocina
│   │   │   └── ProtectedRoute.tsx   # Guard de autenticación por rol
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx    # Métricas admin
│   │   │   ├── UsuariosPage.tsx     # Gestión usuarios
│   │   │   ├── ProductosPage.tsx    # Gestión productos
│   │   │   ├── mesero/
│   │   │   │   ├── PedidosPage.tsx      # Lista de pedidos mesero
│   │   │   │   └── NuevoPedidoPage.tsx  # Crear/editar pedido
│   │   │   └── cocina/
│   │   │       └── PedidosCocinaPage.tsx # Vista orders cocina
│   │   ├── services/      # API clients (auth, users, products, orders, metrics)
│   │   ├── hooks/         # useAuth custom hook
│   │   ├── types/         # TypeScript interfaces (User, Order, Product, Metrics)
│   │   └── utils/         # Axios con interceptores JWT
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── Dockerfile
│
├── docker-compose.yml     # Backend + Frontend + PostgreSQL + Redis
├── start-docker.ps1       # Script arranque Docker
├── start-dev.ps1          # Script desarrollo local
└── setup-db.ps1           # Script creación BD
```

---

## � Modelo de Permisos (RBAC)

| Acción | Admin | Mesero (propio) | Cocina |
|--------|-------|-----------------|--------|
| Ver todos los pedidos | ✅ | ❌ (solo suyos) | ✅ |
| Crear pedido | ✅ | ✅ | ❌ |
| Editar pedido | ✅ | ✅ | ❌ |
| Cancelar pedido | ✅ | ✅ | ❌ |
| Eliminar pedido | ✅ | ✅ | ❌ |
| Cambiar estado a cualquier valor | ✅ | ✅ | ❌ |
| Marcar como entregado | ✅ | ✅ | ✅ |
| Gestionar usuarios/productos | ✅ | ❌ | ❌ |
| Ver métricas | ✅ | ❌ | ❌ |
| Ver historial despachados (día/mes) | ✅ | ❌ | ✅ |
| Configurar retención historial | ✅ | ❌ | ❌ |

---

## �🛠️ Tech Stack Detallado

**Backend:**
- FastAPI 0.110.0 (Framework)
- SQLAlchemy 2.0.29 + asyncpg (ORM + async DB)
- PostgreSQL 15+ (Base de datos)
- Redis (Caché/sesiones)
- Python-Jose + Passlib (Autenticación)
- Pydantic 2.6.4 (Validación de datos)

**Frontend:**
- React 18.2.0 + TypeScript
- Vite 7.3.1 (Build tool)
- React Router DOM (Navegación)
- Axios (HTTP client)
- Recharts (Gráficos)
- Tailwind CSS 3.4.17 (Estilos)
- Lucide React (Iconos)

---

## 📚 Documentación Adicional

- [QUICKSTART.md](QUICKSTART.md) - Guía completa de setup
- [Documentación API](http://localhost:8000/docs) - Swagger UI (en vivo)
- Archivos .env:
  - `backend/.env.development` - Config local
  - `backend/.env.production` - Config producción
  - `frontend/.env` - API endpoint

---

## 🔧 Desarrollo Local (sin Docker)

```bash
cd backend

# Crear entorno virtual
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Instalar dependencias
pip install -r requirements.txt

# Levantar servicios de BD (con Docker)
docker-compose up -d db redis

# Ejecutar aplicación
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 🗃️ Migraciones de Base de Datos

```bash
# Crear migración
docker-compose exec backend alembic revision --autogenerate -m "descripción"

# Aplicar migraciones
docker-compose exec backend alembic upgrade head
```

## 🛠️ Tecnologías

- **FastAPI** - Framework web moderno y rápido
- **PostgreSQL 15** - Base de datos relacional
- **Redis 7** - Cache y sesiones
- **SQLAlchemy 2.0** - ORM async
- **Alembic** - Migraciones de BD
- **Pydantic v2** - Validación de datos
- **Python-JOSE** - JWT autenticación
- **Passlib** - Hash de contraseñas

## 📝 Variables de Entorno

Ver archivo `backend/.env` para configuración completa.

---

## 📋 Changelog

### v1.3.0 — Historial de Pedidos + Retención Configurable
- **Nuevo:** Historial de pedidos despachados por día y por mes en dashboard admin
- **Nuevo:** Historial de pedidos despachados por día y por mes en panel cocina
- **Nuevo:** Endpoint `GET /metrics/dispatched-history` (acceso `admin` y `cocina`)
- **Nuevo:** Endpoints de configuración `GET/PUT /settings/history-retention` (solo `admin`)
- **Nuevo:** Limpieza automática de pedidos despachados antiguos según política de retención
- **Mejora:** Configuración de retención expuesta en la vista `/admin/configuracion`

### v1.2.0 — Panel Cocina + Correcciones Admin
- **Nuevo:** Panel de cocina (`/cocina/pedidos`) con recarga automática cada 10 segundos
- **Nuevo:** Layout y rutas protegidas para el rol `cocina`
- **Nuevo:** Endpoint `GET /orders` accesible por cocina (veía todos los pedidos)
- **Nuevo:** `PATCH /orders/{id}/status` restringido: cocina solo puede marcar `entregado`
- **Fix:** Dashboard admin `/metrics/dashboard` — error 500 por query SQLAlchemy inválida (`join(Order, True)`)
- **Fix:** Top productos calculado correctamente desde JSONB de ítems por pedido (`jsonb_array_elements`)
- **Fix:** Valores de enum PostgreSQL en mayúsculas (`ENTREGADO`) corregidos en queries raw SQL
- **Fix:** `userService.updateRole` enviaba `rol` en body; corregido a query param
- **Fix:** Toggle activo de usuario en panel admin conectado correctamente al handler
- **Fix:** Formulario de productos unificado para crear y editar
- **Limpieza:** Eliminados archivos scaffold de Vite sin uso (`main.ts`, `counter.ts`, `style.css`, `vite.svg`, `typescript.svg`)

### v1.1.0 — Panel Mesero
- Panel de mesero con gestión completa de pedidos por mesa
- Crear, editar, cancelar pedidos
- Página de nuevo pedido con selector de productos

### v1.0.0 — Panel Admin base
- Dashboard con KPIs y gráficos (Recharts)
- Gestión de usuarios, productos, descuentos y configuración
- Autenticación JWT con rutas protegidas

