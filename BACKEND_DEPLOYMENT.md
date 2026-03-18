# Backend Deployment Guide

## 📋 Opciones de Despliegue para Backend

El backend FastAPI puede desplegarse en varias plataformas:

## ✅ Backend desacoplado del frontend

El proyecto ahora incluye un stack dedicado para backend:

```bash
docker compose -f docker-compose.backend.yml up -d --build
```

Incluye únicamente:
- API FastAPI
- PostgreSQL
- Redis

También puedes usar el script de Windows:

```powershell
.\start-backend.ps1
```

Esto te permite desplegar y validar backend sin depender del contenedor del frontend.

### 1. **Railway** ⭐ (Recomendado)

Railway es una excelente opción para FastAPI + PostgreSQL.

**Steps:**

1. Ve a [Railway.app](https://railway.app)
2. Crea una cuenta (puedes usar GitHub)
3. Nuevo proyecto > Deploy desde GitHub > Selecciona tu repositorio
4. Railway detectará automáticamente que hay un `requirements.txt`

**Configuración en Railway:**

1. Agrega servicio de PostgreSQL:
   - Dashboard > Add > PostgreSQL
   
2. Configura variables de entorno:
   ```
   DATABASE_URL=tu-url-de-railway-postgres
   REDIS_URL=tu-redis-url (si lo usas)
   SECRET_KEY=generate-una-clave-aleatoria-segura
   ENVIRONMENT=production
   ```

3. Setup automático de base de datos:
   - Railway ejecutará automáticamente `python main.py` al desplegar
   - Si tienes migraciones con Alembic, agrega pre-deployment hook

**URL de producción:** Railway generará algo como `https://tu-app-railway.up.railway.app`

### 2. **Render**

[Render.com](https://render.com) también soporta Python/FastAPI

1. Conecta tu repositorio
2. Crea nuevo Web Service
3. Selecciona `Python 3` runtime
4. Build command: `pip install -r requirements.txt`
5. Start command: `python main.py`

### 3. **Heroku** (Requiere tarjeta de crédito)

[Heroku.com](https://heroku.com) con Procfile:

```
web: python main.py
```

## 🗄️ Base de Datos

### PostgreSQL en Railway/Render

1. Agrega PostgreSQL como servicio
2. Copia la `DATABASE_URL`
3. Usa en variable de entorno `DATABASE_URL`

### Migración de Datos

Si tienes datos locales que quieres migrar:

```bash
# Exportar desde local
pg_dump -h localhost -U usuario base_datos > backup.sql

# Importar a producción
psql -h host-produccion -U usuario -d base_datos < backup.sql
```

## 🔐 Variables de Entorno Necesarias

```
# Base de datos
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Redis (para caché y sesiones)
REDIS_URL=redis://user:password@host:6379

# JWT Secret Key
SECRET_KEY=generate-con-openssl-rand-hex-32

# Ambiente
ENVIRONMENT=production

# CORS Origins (Vercel frontend)
CORS_ORIGINS=https://tu-dominio-vercel.vercel.app,https://tu-dominio-personalizado.com

# Logging
LOG_LEVEL=info

# Email (si lo usas)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-contraseña-app
```

Notas importantes:
- Si defines `DATABASE_URL`, el backend la usará automáticamente (compatible con Railway/Render).
- Si NO defines `DATABASE_URL`, usará `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_HOST`, `POSTGRES_PORT`.
- `CORS_ORIGINS` acepta una lista separada por comas.

## 📋 Pre-Deployment Checklist

- [ ] `requirements.txt` actualizado con todas las dependencias
- [ ] `main.py` listo para ejecutarse como `python main.py`
- [ ] Todas las variables de entorno definidas
- [ ] Base de datos creada y migrada
- [ ] CORS configurado para incluir el dominio del frontend
- [ ] Tests pasando localmente
- [ ] Secrets no están en el código (usar solo variables de entorno)

## 🚀 Arquitectura de Despliegue Recomendada

```
┌─────────────────────────────────────────┐
│  Usuario (Cliente)                      │
└──────────────┬──────────────────────────┘
               │
               │ HTTPS/TLS
               ▼
┌─────────────────────────────────────────┐
│  Frontend (Vercel)                      │
│  https://taosistem-frontend.vercel.app │
│  - React + TypeScript                    │
│  - Vite Build                            │
└──────────────┬──────────────────────────┘
               │
               │ API Calls (VITE_API_URL)
               ▼
┌─────────────────────────────────────────┐
│  Backend (Railway/Render)               │
│  https://api-backend.railway.app        │
│  - FastAPI                              │
│  - Async SQLAlchemy                     │
│  - PostgreSQL Connection                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  PostgreSQL Database (Railway)          │
│  - Datos persistentes                   │
│  - Backups automáticos                  │
└─────────────────────────────────────────┘
```

## 🔒 CORS Configuration en Backend

Actualiza `backend/main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:8000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🧪 Validación Post-Deploy

```bash
# Ver si el backend está activo
curl https://tu-backend-url/docs

# Verificar health check
curl https://tu-backend-url/health

# Test de login
curl -X POST https://tu-backend-url/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

## 📊 Monitoreo

- **Railway:** Dashboard integrado con logs en tiempo real
- **Render:** Similar al de Railway
- **Heroku:** Dyno logs: `heroku logs --tail`

## 🚨 Troubleshooting

### Error: "Cannot import module"
Asegúrate de que `requirements.txt` tenga todas las dependencias:
```bash
pip freeze > requirements.txt
```

### Error: "Database connection failed"
- Verifica que `DATABASE_URL` sea correcto
- Check que las credenciales sean exactas
- Asegúrate que la IP del servidor esté en whitelist (si aplica)

### Error CORS
Backend no está permitiendo solicitudes desde Vercel frontend:
- Verifica `CORS_ORIGINS` variable de entorno
- Incluir: `https://tu-dominio-vercel.vercel.app`

## 📞 Comandos Útiles

```bash
# Generar SECRET_KEY seguro
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Testear database connection
python -c "from app.core.database import engine; print(engine.url)"

# Ver logs en Railway
railway logs

# Deploy desde CLI
railway up
```

## 🔗 Enlaces Útiles

- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [PostgreSQL best practices](https://www.postgresql.org/docs/)
