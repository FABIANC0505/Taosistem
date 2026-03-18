# 🚀 Despliegue Frontend (Vercel) + Backend (Railway)

Guía paso a paso para desplegar **frontend en Vercel** y **backend en Railway** de forma independiente.

---

## 📋 Requisitos Previos

- Cuenta en GitHub (código en repositorio público o privado)
- Cuenta en [Vercel](https://vercel.com) (conectada con GitHub)
- Cuenta en [Railway](https://railway.app) (conectada con GitHub)
- Terminal o PowerShell con Git configurado

---

## 🔹 FASE 1: Preparación

### 1. Generar SECRET_KEY seguro

En PowerShell:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Copia el resultado** — lo necesitarás en Railway.

### 2. Crear repositorio de GitHub para el backend

Si aún no tienes un repo separado para el backend:

```powershell
# Desde la carpeta del proyecto
cd backend

# Inicializar Git (si no lo está)
git init
git add .
git commit -m "Backend separado para despliegue"

# Conectar con GitHub (replace tu-usuario/taosistem-backend con tu repo)
git remote add origin https://github.com/tu-usuario/taosistem-backend.git
git branch -M main
git push -u origin main
```

---

## 🔹 FASE 2: Backend en Railway

Railway detectará `requirements.txt` y `main.py` automáticamente.

### Paso 1: Crear proyecto en Railway

1. Ve a [railway.app](https://railway.app)
2. Click en **"Create New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Conecta tu repo del backend (`taosistem-backend`)
5. Railway detectará y desplegará automáticamente

### Paso 2: Agregar PostgreSQL

1. En el dashboard de Railway, click en **"+ Add"**
2. Selecciona **"PostgreSQL"**
3. Se creará automáticamente un servicio de base de datos

### Paso 3: Configurar variables de entorno

Railway genera automáticamente `DATABASE_URL` from PostgreSQL. Agrega manualmente:

**En Railway Dashboard:**

1. Selecciona el servicio **backend**
2. Ve a **Variables**
3. Agrega cada variable (click en **"Add Variable"**):

| Variable | Valor | Ejemplo |
|----------|-------|---------|
| `SECRET_KEY` | Tu clave generada en Fase 1 | `aBcD...xyz==` |
| `JWT_SECRET_KEY` | Igual a `SECRET_KEY` | (mismo valor) |
| `ENVIRONMENT` | `production` | `production` |
| `APP_ENV` | `production` | `production` |
| `CORS_ORIGINS` | Tu URL de Vercel (agregarás después) | `https://taosistem.vercel.app` |

**Notas:**
- Railway genera `DATABASE_URL` automáticamente (no la agregues manualmente)
- El backend leerá `DATABASE_URL` primero, luego `POSTGRES_*` (fallback)
- CORS_ORIGINS puede tener múltiples URLs separadas por comas

### Paso 4: Desplegar

Rail detectará cambios automáticamente. Si no inicia:

1. Ve a **Deployments**
2. Click en el último deployment
3. Busca **"Redeploy"** si hay error
4. Revisa **"Logs"** para diagnosticar

**Resultado esperado:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
Conexion a PostgreSQL exitosa y tablas creadas
```

### Paso 5: Copiar la URL de Railway

Una vez desplegado exitosamente:

1. Ve a **Settings**
2. En **Domains**, copia tu URL pública (ej: `https://taosistem-api-production.up.railway.app`)
3. **Guárdala** — la necesitarás para Vercel

---

## 🔹 FASE 3: Frontend en Vercel

### Paso 1: Desplegar en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Click en **"Add New..."** → **"Project"**
3. Selecciona tu repo del **frontend** (o del proyecto completo si está en el mismo repo)
4. Vercel auto-detectará:
   - **Framework**: Vite
   - **Root Directory**: `frontend` (si lo pregunta)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Paso 2: Agregar variables de entorno

Antes de desplegar, agrega la URL del backend:

**En la pantalla de configuración de Vercel:**

Busca **"Environment Variables"** y agrega:

| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | Tu URL de Railway (ej: `https://taosistem-api-production.up.railway.app`) |

### Paso 3: Desplegar

Click en **"Deploy"**. Vercel compilará y desplegará automáticamente.

**Resultado esperado:**
```
✓ Built successfully
✓ Deployed to vercel.com
```

Tu URL será algo como: `https://taosistem-frontend.vercel.app`

---

## 🔹 FASE 4: Actualizar CORS en Railway

Ahora que tienes la URL de Vercel, actualiza `CORS_ORIGINS` en Railway:

1. Railway Dashboard → Servicio **backend** → **Variables**
2. Edita `CORS_ORIGINS` con ambas URLs:

```
https://taosistem-frontend.vercel.app,https://taosistem.vercel.app
```

(Reemplaza con tus URLs reales)

3. Guarda — Railway redesplegará automáticamente

---

## 🔹 VALIDACIÓN POST-DESPLIEGUE

### 1. Verificar Backend

```bash
curl https://tu-backend-railway-url/health
```

Respuesta esperada:
```json
{"status":"ok","app":"RestauTech"}
```

### 2. Verificar Swagger UI del Bbackend

Abre en navegador:
```
https://tu-backend-railway-url/docs
```

### 3. Verificar Frontend

Abre en navegador:
```
https://tu-frontend-vercel-url
```

Debería cargar sin errores CORS.

### 4. Test de Login

1. Abre el frontend
2. Intenta login con: `admin@restaurante.com` / `admin123`
3. Debería redirigir al dashboard

---

## 🛠️ Troubleshooting

### ❌ Error CORS en frontend

**Síntoma:** `Access to XMLHttpRequest blocked by CORS`

**Solución:**
1. Verifica `CORS_ORIGINS` en Railway incluye la URL de Vercel
2. Verifica `VITE_API_URL` en Vercel es la correcta
3. Espera 5 min para que Railway redeploy complete

### ❌ Backend no conecta a PostgreSQL

**Síntoma:** `could not connect to server`

**Solución:**
1. Verifica `DATABASE_URL` en Railway está correcta
2. Revisa **Logs** de Railway para ver el error exacto
3. Puede ser que PostgreSQL no esté listo — espera 2 min

### ❌ Frontend no carga datos

**Síntoma:** Blank page o errores en console

**Solución:**
1. Abre DevTools (F12)
2. Ve a **Network** y mira las requests fallidas
3. Verifica que `VITE_API_URL` es la URL correcta del backend

### ❌ Login falla

**Síntoma:** "Invalid credentials"

**Solución:**
1. Verifica que se ejecutó `alembic upgrade head` (debería hacerse al iniciar backend)
2. Crea un usuario via API (consulta [BACKEND_DEPLOYMENT.md](BACKEND_DEPLOYMENT.md))
3. Revisa logs de Railway para errores de base de datos

---

## 📊 URLs Finales

Una vez todo deployado:

| Componente | URL |
|-----------|-----|
| Frontend | `https://taosistem-frontend.vercel.app` |
| Backend API | `https://tu-backend-production.up.railway.app` |
| API Docs | `https://tu-backend-production.up.railway.app/docs` |

---

## 📝 Checklist Pre-Despliegue

- [ ] `backend/requirements.txt` está actualizado
- [ ] `backend/main.py` está actualizado (con `if __name__` para Railway)
- [ ] `backend/Dockerfile` sin `--reload`
- [ ] Backend sube a GitHub en repositorio separado
- [ ] Frontend usará `VITE_API_URL` en `src/utils/api.ts`
- [ ] Railway tiene `SECRET_KEY`, `CORS_ORIGINS` configurados
- [ ] Vercel tiene `VITE_API_URL` configurado
- [ ] Logs de Railway no muestran errores de import

---

## 🔗 Enlaces Útiles

- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Vite Build Guide](https://vitejs.dev/guide/ssr.html)

---

## 💡 Pro Tips

1. **Monitoreo**: Railway dashboard muestra logs en tiempo real — úsalo para debug
2. **Redeploy**: Si cambias variables de entorno en Railway, hace redeploy automático
3. **Backups**: Railway mantiene backups automáticos de PostgreSQL
4. **Escalado**: Si el backend se queda sin memoria, Railway ofrece upgrade de dyno

¡Listo para producción! 🎉
