# RestauTech

Sistema local para la operación de un restaurante, con panel administrativo y módulos para meseros, cocina y caja.

## Stack actual

- `frontend/`: React 19, TypeScript, Vite, React Router, Tailwind CSS y Recharts.
- `backend/`: FastAPI, Uvicorn, Pydantic y autenticación JWT.
- Persistencia local: SQLite mediante `aiosqlite`.
- Persistencia de producción: configuración compatible con MySQL mediante `DATABASE_URL`.
- Imágenes: almacenamiento local o Cloudflare R2.

## Funcionalidades

- Inicio de sesión y control de acceso por rol.
- Panel administrativo.
- Gestión de usuarios y productos.
- Descuentos y configuración del restaurante.
- Historial de pedidos.
- Módulos para mesero, cocina y cajero.
- API documentada con Swagger.

## Requisitos

- Python 3.11 o superior.
- Node.js 18 o superior.
- PowerShell en Windows para usar `start-dev.ps1`.

No se necesita MySQL para la validación local si se utiliza SQLite.

## Configuración local

### Backend

Copia `backend/.env.example` como `backend/.env`. Para SQLite local, configura:

```env
APP_ENV=development
USE_SQLITE=1
SQLITE_PATH=dev.db
JWT_SECRET_KEY=change-this-in-development
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
STORAGE_BACKEND=local
```

En desarrollo, `SQLITE_PATH=dev.db` se interpreta desde `backend/`, por lo que la base usada es `backend/dev.db`.

### Frontend

Copia `frontend/.env.example` como `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=RestauTech
```

Usa `localhost` durante las pruebas. La configuración CORS actual contempla `http://localhost:3000`; abrir el frontend con `127.0.0.1:3000` puede provocar errores de red en las llamadas a la API.

## Ejecutar en local

Desde la raíz del proyecto:

```powershell
.\start-dev.ps1
```

El script crea el entorno virtual del backend si no existe, instala dependencias y levanta ambos servicios.

URLs locales:

- Aplicación: <http://localhost:3000>
- API: <http://localhost:8000>
- Health check: <http://localhost:8000/health>
- Swagger: <http://localhost:8000/docs>

Para ejecutar los servicios manualmente:

```powershell
# Backend
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend, en otra terminal
cd frontend
npm install
npm run dev
```

## Validación

Compilar el frontend:

```powershell
cd frontend
npm run build
```

Comprobar la API:

```powershell
Invoke-WebRequest http://localhost:8000/health
```

La respuesta esperada es `200 OK` con un JSON similar a:

```json
{"status":"ok","app":"RestauTech"}
```

## Estado conocido

- El frontend compila correctamente con `npm run build`.
- El login y la navegación por roles funcionan en local.
- Productos, descuentos y configuración cargan en el panel administrativo.
- Algunas vistas que consultan métricas, usuarios o historial todavía reportan errores cuando se ejecutan con SQLite porque conservan consultas basadas en SQLAlchemy mientras el adaptador local usa `aiosqlite`. Estas rutas requieren una unificación del acceso a datos antes de considerarse listas para producción.

## Producción

Para un despliegue con MySQL y Cloudflare R2, configura las variables de entorno del proveedor:

```env
DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/DATABASE
STORAGE_BACKEND=r2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_BASE_URL=https://...
```

No subas archivos `.env`, contraseñas, tokens ni bases SQLite al repositorio.
