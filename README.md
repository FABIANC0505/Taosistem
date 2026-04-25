# RestauTech

Proyecto reducido al stack minimo necesario para correr localmente:

- `backend/`: FastAPI + SQLAlchemy async + MySQL
- `frontend/`: React + TypeScript + Vite
- `start-dev.ps1`: arranque local

## Estructura

```text
backend/
  app/
  uploads/
  requirements.txt
  .env.example
frontend/
  src/
  public/
  package.json
  .env.example
start-dev.ps1
README.md
```

## Requisitos

- Python 3.11+
- Node.js 18+
- MySQL 8 corriendo localmente

## Configuracion

### Backend

Copia `backend/.env.example` a `backend/.env` y ajusta:

```env
MYSQL_USER=taosistem_app
MYSQL_PASSWORD=050523
MYSQL_DB=bdtaosistem
MYSQL_HOST=localhost
MYSQL_PORT=3306
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

El backend crea las tablas automaticamente al iniciar.

### Frontend

Copia `frontend/.env.example` a `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=RestauTech
```

## Ejecutar

```powershell
.\start-dev.ps1
```

URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`

## Notas

- Las imagenes de productos se guardan en `backend/uploads/`.
- El proyecto ya no usa Docker ni `docker-compose`.
