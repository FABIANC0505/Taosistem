# 🚀 Frontend Deployment Guide (Vercel)

Guía para desplegar el frontend de **TaoSistem** en Vercel.

---

## 📋 Requisitos

- Cuenta en [Vercel.com](https://vercel.com)
- Repositorio en GitHub
- Backend desplegado en Railway (con su URL)

---

## 🔧 Pre-Despliegue

### 1. Validar Frontend Localmente

```bash
cd frontend

# Instalar dependencias (si no están installadas)
npm install

# Build de prueba
npm run build
```

Debe completarse sin errores.

### 2. Ejecutar Validación Automática

```bash
node validate_deployment.js
```

Debe pasar todos los checks.

### 3. Verificar Variables de Entorno

Frontend debe usar `VITE_API_URL` para apuntar al backend:

```bash
# Verifica que src/utils/api.ts usa:
# import.meta.env.VITE_API_URL
```

---

## 📤 Subir Frontend a GitHub

Si despliegas desde el repo raíz del proyecto:

```bash
# Asegúrate que todo esté commiteado
git add .
git commit -m "Prepare frontend for Vercel deployment"
git push origin main
```

Si tienes un repo separado para frontend:

```bash
cd frontend
git init
git add .
git commit -m "Initial frontend commit"
git remote add origin https://github.com/TU-USUARIO/taosistem-frontend.git
git branch -M main
git push -u origin main
```

---

## 🚀 Desplegar en Vercel

### Paso 1: Conectar Repositorio

1. Ve a [vercel.com](https://vercel.com)
2. Click en **"Add New..."** → **"Project"**
3. Selecciona tu repo de GitHub
4. Vercel detectará automáticamente:
   - **Framework**: Vite
   - **Root Directory**: `frontend` (si está en subcarpeta)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Paso 2: Agregar Variables de Entorno

En la pantalla de configuración:

1. Click en **"Environment Variables"**
2. Agrega:

| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | Tu URL de Railway (ej: `https://taosistem-api-production.up.railway.app`) |

3. Selecciona **"Preview"** y **"Production"** (aplica en ambos)

### Paso 3: Desplegar

Click en **"Deploy"**

Vercel compilará y desplegará automáticamente.

**Expected output:**
```
✓ Built successfully
✓ Deployed to vercel.com
```

Tu URL será: `https://tu-proyecto-frontend.vercel.app`

---

## ✅ Verificar Frontend

### Acceso a la Aplicación

Abre en navegador tu URL de Vercel.

Debe:
- Cargar la página sin errores
- Mostrar el login
- **No hay errores CORS en console** (F12 → Console)

### Test de Login

1. Intenta login con:
   - Email: `admin@restaurante.com`
   - Password: `admin123`
2. Debería redirigir al dashboard
3. No debe haber errores de red

---

## 🔗 Actualizar CORS en Backend

Si aún no lo hiciste:

1. Ve a Railway → Backend Settings → Variables
2. Edita `CORS_ORIGINS`:
```
https://tu-frontend.vercel.app,https://tu-dominio.vercel.app
```
3. Railway redesplegará automáticamente

---

## 🛠️ Troubleshooting

### ❌ Error: "Build failed"

**Solución:**
- Abre los logs en Vercel para ver el error exacto
- Asegúrate que `npm run build` funciona localmente
- Verifica `tsconfig.json` esté correcto

### ❌ Error: "Cannot find module"

**Solución:**
- Verifica que `node_modules` no está en .gitignore (sí debe estarlo)
- Vercel reinstalará con `npm install`
- Si persiste, borra `package-lock.json` y sube de nuevo

### ❌ Error CORS: "Access to XMLHttpRequest blocked"

**Síntomas:** Console muestra error de CORS

**Solución:**
- Verifica `VITE_API_URL` en Vercel es correcta
- Verifica `CORS_ORIGINS` en Railway incluye tu URL de Vercel
- Espera 2-3 min a que cambios se apliquen
- Borra caché del navegador (Ctrl+Shift+Delete)

### ❌ Blank page o errores en console

**Solución:**
- Abre DevTools (F12)
- Ve a **Network** y busca las requests fallidas
- Ve a **Console** y lee el error exacto
- Verifica `VITE_API_URL` apunta a la URL correcta de Railway

### ❌ Login no funciona

**Solución:**
- Verifica que el backend en Railway está activo (endpoint `/health`)
- Revisa que CORS está configurado
- En DevTools → Network, ve las requisitas al backend
- Si está rojo, es error de CORS o backend no responde

---

## 📊 Monitorear en Producción

**Vercel Dashboard:**
- Analytics → Performance metrics
- Deployments → Ver historial
- Logs → Ver logs del último deployment
- Settings → Redeploy si es necesario

---

## 🔄 Redeploy Rápido

Si necesitas redeploy sin cambios de código:

1. Ve a Vercel Dashboard → **Deployments**
2. Click en el deployment más reciente
3. Click en **"Redeploy"**

---

## 📚 Enlaces Útiles

- [Vercel Docs](https://vercel.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)

---

## ✅ Pre-Despliegue Checklist

- [ ] Frontend valida con `node validate_deployment.js`
- [ ] `npm run build` funciona sin errores
- [ ] `src/utils/api.ts` usa `VITE_API_URL`
- [ ] `.env` no está en Git (agrega a .gitignore)
- [ ] Backend desplegado en Railway con URL conocida
- [ ] Code está en GitHub
- [ ] `VITE_API_URL` correcta en Vercel settings
- [ ] Test de login funciona
- [ ] Sin errores CORS en console

---

¡Listo para producción! 🎉
