# 🚀 Backend Deployment Guide (Railway)

Guía para desplegar el backend de **TaoSistem** en Railway.

---

## 📋 Requisitos

- Cuenta en [Railway.app](https://railway.app)
- Repositorio en GitHub (backend separado)
- Git configurado localmente

---

## 🔧 Pre-Despliegue

### 1. Validar Backend Localmente

Asegúrate que el backend está corriendo:

```powershell
# Desde la raíz del proyecto
.\start-backend.ps1
```

Debe mostrar:
```
✓ Backend listo en http://localhost:8000
```

### 2. Ejecutar Validación Automática

Antes de subir a GitHub:

```bash
cd backend
python validate_deployment.py
```

Debe pasar todos los checks. Si falla, corrige los problemas indicados.

### 3. Asegurar que requirements.txt esté actualizado

```bash
# En la carpeta del proyecto
pip freeze > backend/requirements.txt
```

---

## 📤 Subir Backend a GitHub

Si aún no tienes un repo separado:

```bash
cd backend

# Inicializar Git
git init
git add .
git commit -m "Initial backend commit"

# Crear repo en GitHub y conectar
git remote add origin https://github.com/TU-USUARIO/taosistem-backend.git
git branch -M main
git push -u origin main
```

---

## 🚀 Desplegar en Railway

### Paso 1: Crear Proyecto

1. Ve a [railway.app](https://railway.app)
2. Click en **"Create New Project"**
3. Selecciona **"Deploy from GitHub Repo"**
4. Conecta tu repo `taosistem-backend`

Railway detectará automáticamente `requirements.txt` y `main.py`.

### Paso 2: Agregar PostgreSQL

1. En el dashboard, click en **"+ Add Service"**
2. Selecciona **"PostgreSQL"**

Railway generará automáticamente `DATABASE_URL`.

### Paso 3: Configurar Variables de Entorno

En **settings** del servicio backend, agrega:

| Variable | Valor | Notas |
|----------|-------|-------|
| `SECRET_KEY` | *Genera una nueva clave segura* | Usa: `python -c "import secrets; print(secrets.token_urlsafe(32))"` |
| `JWT_SECRET_KEY` | *Mismo valor que SECRET_KEY* | - |
| `ENVIRONMENT` | `production` | - |
| `APP_ENV` | `production` | - |
| `CORS_ORIGINS` | `https://tu-frontend.vercel.app` | *Agregarás la URL de Vercel después* |

**Notas:**
- `DATABASE_URL` se genera automáticamente — no la agregues manualmente
- Railway levantará el servicio automáticamente

### Paso 4: Monitorear Despliegue

1. Ve a **"Deployments"**
2. Espera a que termine (estado "Success")
3. Revisa **"Logs"** si hay errores

**Logs esperados:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
RestauTech API iniciada
Conexion a PostgreSQL exitosa y tablas creadas
```

### Paso 5: Copiar URL Pública

Una vez deployado:

1. Ve a **"Settings"**
2. En **"Domains"**, copia la URL generada
3. Ejemplo: `https://taosistem-api-production.up.railway.app`
4. **Guárdala** — la necesitarás en Vercel

---

## ✅ Verificar Backend

### Health Check

```bash
curl https://tu-railway-url/health
```

Respuesta esperada:
```json
{"status":"ok","app":"RestauTech"}
```

### Swagger UI

Abre en navegador:
```
https://tu-railway-url/docs
```

---

## 🔗 Actualizar CORS

Una vez que despliegues el frontend en Vercel:

1. Vuelve a Railway → Backend Settings → Variables
2. Edita `CORS_ORIGINS` con ambas URLs:
```
https://tu-frontend.vercel.app,https://tu-dominio-personalizado.vercel.app
```
3. Railway redesplegará automáticamente

---

## 🛠️ Troubleshooting

### ❌ Error: "Cannot import module"

**Solución:**
- Verifica que `requirements.txt` esté actualizado
- Revisa que todas las dependencias estén listadas
- En Railway, ve a Logs y busca el módulo que falta

### ❌ Error: "Database connection failed"

**Solución:**
- Verifica que PostgreSQL también está deployado
- `DATABASE_URL` debería estar establecida automáticamente
- Espera 1-2 min a que PostgreSQL inicicer

### ❌ Error: "Port already in use"

Railway maneja los puertos automáticamente — no necesitas configurar nada.

### ❌ CORS errors

- Verifica `CORS_ORIGINS` incluya la URL de Vercel
- Espera 2-3 min a que Railway redeploy se complete

---

## 📊 Monitorear en Producción

**Railway Dashboard:**
- Ver logs en tiempo real → **"Logs"**
- Métricas de CPU/memoria → **"Monitoring"**
- Redeploy manual → **"Redeploy"** en Deployments

---

## 🔑 Comandos Útiles

```bash
# Ver variables de entorno en Railway
railway env

# Ver logs
railway logs

# Redeploy manual
railway up

# Generar SECRET_KEY seguro
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 📚 Enlaces Útiles

- [Railway Docs](https://docs.railway.app)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [SQLAlchemy Async](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)

---

## ✅ Pre-Despliegue Checklist

- [ ] Backend valida con `python validate_deployment.py`
- [ ] Code está en GitHub
- [ ] `requirements.txt` está actualizado
- [ ] `main.py` tiene `if __name__ == "__main__"`
- [ ] `Dockerfile` no tiene `--reload`
- [ ] PostgreSQL agregada a Railway
- [ ] Variables de entorno configuradas
- [ ] Logs muestran "Application startup complete"

---

¡Listo para producción! 🎉
