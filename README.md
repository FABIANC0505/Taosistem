# RestauTech

Sistema local para la operacion de un restaurante, con panel administrativo y modulos para meseros, cocina y caja.

## Stack actual

- `frontend/`: React 19, TypeScript, Vite, React Router, Tailwind CSS y Recharts.
- `backend/`: FastAPI, Uvicorn, Pydantic y autenticacion JWT.
- Persistencia local: SQLite mediante `aiosqlite`.
- Persistencia de produccion: configuracion compatible con MySQL mediante `DATABASE_URL`.
- Imagenes: almacenamiento local o Cloudflare R2.

## Funcionalidades

- Inicio de sesion y control de acceso por rol.
- Panel administrativo.
- Gestion de usuarios y productos.
- Descuentos y configuracion del restaurante.
- Historial de pedidos.
- Modulos para mesero, cocina y cajero.
- API documentada con Swagger.

## Requisitos

- Python 3.12.
- Node.js 18 o superior.
- PowerShell en Windows para usar `start-dev.ps1`.

No se necesita MySQL para la validacion local si se utiliza SQLite.

## Configuracion local

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

Usa `localhost` durante las pruebas. La configuracion CORS actual contempla `http://localhost:3000`; abrir el frontend con `127.0.0.1:3000` puede provocar errores de red en las llamadas a la API.

## Ejecutar en local

Desde la raiz del proyecto:

```powershell
.\start-dev.ps1
```

El script crea el entorno virtual del backend si no existe, instala dependencias y levanta ambos servicios.

URLs locales:

- Aplicacion: <http://localhost:3000>
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

## Validacion

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
- El login y la navegacion por roles funcionan en local.
- Productos, descuentos y configuracion cargan en el panel administrativo.
- Las rutas principales del backend comparten el acceso a datos por SQLAlchemy async.

## Produccion

El repositorio esta preparado como monorepo para desplegar cada aplicacion por separado:

- Render: configura `backend/` como Root Directory. Usa `pip install -r requirements.txt` como Build Command y `uvicorn main:app --host 0.0.0.0 --port $PORT` como Start Command. El health check es `/health`.
- Vercel: configura `frontend/` como Root Directory, `npm run build` como Build Command y `dist` como Output Directory. `frontend/vercel.json` mantiene funcionando las rutas de React Router.
- En Vercel define `VITE_API_URL` con la URL publica de Render, por ejemplo `https://taosistem.onrender.com`.
- En Render define `CORS_ORIGINS` con la URL publica de Vercel y usa MySQL como base de datos externa.

Para un despliegue con MySQL y Cloudflare R2, configura las variables de entorno del proveedor:

```env
APP_ENV=production
DATABASE_URL=mysql+aiomysql://USER:PASSWORD@HOST:3306/DATABASE
JWT_SECRET_KEY=generate-a-long-random-secret
JWT_ALGORITHM=HS256
JWT_ACCESS_EXPIRE_MINUTES=480
JWT_REFRESH_EXPIRE_DAYS=30
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGINS=https://your-frontend.vercel.app
STORAGE_BACKEND=r2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_BASE_URL=https://...
```

No uses `localhost` en `DATABASE_URL` o `MYSQL_HOST` dentro de Render: `localhost` apunta al contenedor del backend, no a tu base MySQL.

No subas archivos `.env`, contrasenas, tokens ni bases SQLite al repositorio.
