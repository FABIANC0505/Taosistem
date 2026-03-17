# 🧪 Testing & Validation Guide

## ✅ Verificaciones Rápidas

### 1. Backend API Health

```powershell
# Verificar que el backend responde
curl http://localhost:8000/health

# Respuesta esperada:
# {"status":"ok","app":"RestuTech"}
```

### 2. Frontend Loaded

```powershell
# Verificar que frontend está sirviendo HTML
curl http://localhost:3000

# Debería retornar HTML (no un error)
```

### 3. Database Connection

```powershell
# Conectar a PostgreSQL (si usas local)
psql -U restautech_user -d restautech_db -h localhost

# Comando en psql
\dt  # Listar tablas
\q   # Salir
```

---

## 🔓 Login & Authentication

### Crear un usuario de prueba

**Opción 1: Vía Swagger UI** (Fácil)
1. Abre http://localhost:8000/docs
2. Busca `POST /auth/register`
3. Click "Try it out"
4. Ingresa:
```json
{
  "nombre": "Admin Usuario",
  "email": "admin@restaurante.com",
  "password": "admin123"
}
```
5. Click "Execute"

**Opción 2: cURL** (Terminal)
```powershell
$body = @{
  nombre = "Admin Usuario"
  email = "admin@restaurante.com"
  password = "admin123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8000/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

### Login en Frontend

1. Abre http://localhost:3000/login
2. Ingresa:
   - Email: `admin@restaurante.com`
   - Password: `admin123`
3. Deberías ser redirigido a `/admin` (Dashboard)

---

## 📊 Dashboard Verification

Una vez logueado, verifica:

```
✓ 4 KPI Cards visibles:
  • Ingresos Totales (ej: $0.00)
  • Órdenes Totales (ej: 0)
  • Órdenes Hoy (ej: 0)
  • Productos Agotados (ej: 0)

✓ 2 Gráficos (Recharts):
  • Tendencia de Ingresos (LineChart)
  • Top Productos (BarChart)

✓ Fecha y hora actual arriba a la derecha
```

---

## 🔌 API Endpoints Reference

### Authentication (✅ Implementado)

```
POST /auth/register
POST /auth/login
```

### Users (✅ Implementado)

```
GET    /users              # Listar todos
GET    /users/{id}         # Obtener uno
POST   /users              # Crear
PUT    /users/{id}         # Actualizar
DELETE /users/{id}         # Eliminar
PUT    /users/{id}/role    # Cambiar rol
PUT    /users/{id}/deactivate  # Desactivar
```

### Products (✅ Implementado)

```
GET    /products           # Listar todos
GET    /products/{id}      # Obtener uno
POST   /products           # Crear (multipart form-data)
PUT    /products/{id}      # Actualizar
DELETE /products/{id}      # Eliminar
PUT    /products/{id}/mark-out-of-stock  # Marcar agotado
GET    /products/category/{categoria}    # Filtrar por categoría
```

### Metrics (✅ Implementado)

```
GET /metrics/dashboard      # KPIs + Gráficos
GET /metrics/income-trends  # Ingresos por día
GET /metrics/top-products   # Top 5 productos
GET /metrics/statistics     # Estadísticas completas
GET /metrics/dispatched-history  # Historial despachados día/mes (admin/cocina)
```

### Settings (✅ Implementado)

```
GET /settings/history-retention  # Obtener retención de historial (solo admin)
PUT /settings/history-retention  # Actualizar retención de historial (solo admin)
```

---

## ✅ Lo que se implementó

### 📊 Dashboard Completo
- KPI Cards (Ingresos, Órdenes, Agotados)
- Gráfico de Tendencia de Ingresos
- Cálculo de **MEDIA y MODA** de ingresos
- Top 10 Productos
- Producto más vendido

### 👥 Gestión de Usuarios
- Listar usuarios en tabla
- Crear nuevo usuario
- Cambiar rol (Admin/Mesero/Cocina)
- Eliminar usuario
- Estado activo/inactivo

### 🍽️ Gestión de Productos
- Grid de productos
- Crear con imagen
- Editar
- Eliminar
- Marcar como agotado

### ⚙️ Otras Funcionalidades
- Sistema de descuentos
- Configuración del restaurante
- Autenticación JWT
- Rutas protegidas por rol
- Responsive design

---

## 🔧 Primeros Pasos

### 1️⃣ Verificar Backend

```bash
cd backend

# Asegúrate de tener:
# - PostgreSQL corriendo
# - Variables de entorno (.env)
# - Dependencias instaladas (requirements.txt)

# Crea un usuario admin para pruebas:
python -c "
from app.core.security import hash_password
from app.models.user import User, UserRole
print(f'Password hash: {hash_password(\"admin123\")}')
"

# Inicia el servidor
uvicorn main:app --reload --port 8000
```

### 2️⃣ Verificar Frontend

```bash
cd frontend

# Instala dependencias (si no estén)
npm install

# Inicia servidor de desarrollo
npm run dev
# Abre http://localhost:3000
```

### 3️⃣ Crear Usuario Admin (Database)

Necesitas una ruta para crear el usuario admin inicial. Opción A - Ruta de registro:

```python
# En auth.py agregar:
@router.post("/register")
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    # Ver código en users.py para estructura
    pass
```

O manualmente en la base de datos:

```sql
INSERT INTO users (id, nombre, email, password_hash, rol, activo)
VALUES (
    gen_random_uuid(),
    'Admin',
    'admin@restaurante.com',
    '$2b$12$...',  -- hash de "admin123"
    'admin',
    true
);
```

### 4️⃣ Probar Login

- URL: http://localhost:3000/login
- Email: `admin@restaurante.com`
- Password: `admin123`
- Deberías ser redirigido a `/admin` (Dashboard)

---

## 📊 Probar Métricas

Una vez logueado, el dashboard debe mostrar:

### KPIs
- **Ingresos Totales**: Suma de órdenes entregadas
- **Total Órdenes**: Conteo general
- **Órdenes Hoy**: Órdenes de hoy
- **Productos Agotados**: Productos con disponible=false

### Gráficos
- **Tendencia**: Línea con ingresos últimos 30 días
- **Media**: Promedio de ingresos diarios
- **Moda**: Valor más frecuente de ingresos
- **Top Productos**: Barras con cantidad e ingresos
- **Despachados por Día**: Conteo diario de pedidos entregados
- **Despachados por Mes**: Conteo mensual de pedidos entregados

---

## 🗂️ Probar Historial de Pedidos y Retención

### 1) Validar visualización de historial

1. Inicia sesión como `admin` y entra a `/admin`.
2. Verifica que aparezcan los bloques:
  - Pedidos despachados por día
  - Pedidos despachados por mes
3. Inicia sesión como `cocina` y entra a `/cocina/pedidos`.
4. Verifica que se muestren listados de despachados por día/mes.

### 2) Validar permisos por rol

- `admin` → `GET /metrics/dispatched-history` ✅
- `cocina` → `GET /metrics/dispatched-history` ✅
- `mesero` → `GET /metrics/dispatched-history` ❌ (403)
- `admin` → `GET/PUT /settings/history-retention` ✅
- `mesero/cocina` → `GET/PUT /settings/history-retention` ❌ (403)

### 3) Validar retención configurable

1. Entra como `admin` a `/admin/configuracion`.
2. Cambia “Retención de historial (días)” y guarda.
3. Consulta `GET /settings/history-retention` y confirma el nuevo valor.
4. Verifica que el historial despachado respete la retención configurada.
5. Confirma que los pedidos `ENTREGADO` fuera del umbral se limpian automáticamente.

---

## 🧪 Casos de Prueba

### Usuarios
```
✓ Crear usuario (mesero)
✓ Listar usuarios
✓ Cambiar rol a cocina
✓ Eliminar usuario
```

### Productos
```
✓ Crear producto (con imagen)
✓ Listar productos
✓ Editar producto
✓ Marcar como agotado
✓ Eliminar producto
```

### Descuentos
```
✓ Crear descuento
✓ Activar/Desactivar
✓ Eliminar descuento
```

### Configuración
```
✓ Actualizar datos restaurante
✓ Horarios
✓ Impuestos
✓ Ajustar retención de historial (días)
✓ Guardar cambios
```

---

## 🐛 Troubleshooting

### Error CORS
```
Solución: Verificar FRONTEND_URL en .env del backend
Debe ser: http://localhost:3000
```

### Error 404 en API
```
Solución: Backend no está corriendo en puerto 8000
Verificar: http://localhost:8000/health
```

### Tabla vacía / Sin datos
```
Solución: 
1. Crear órdenes en otra parte del sistema
2. O insertar datos de prueba directamente en BD
```

### Token expirado
```
Solución: Logout y vuelve a loguear
JWT_ACCESS_EXPIRE_MINUTES=480 (8 horas)
```

---

## 📚 Documentación API

Accede a: http://localhost:8000/docs

Allí puedes:
- Ver todos los endpoints
- Probarlos directamente
- Ver los parámetros y respuestas

---

## 🎯 Checklist de Validación

- [ ] Backend levanta sin errores
- [ ] Frontend se abre en http://localhost:3000
- [ ] Login funciona
- [ ] Dashboard carga datos
- [ ] Gráficos se renderizan
- [ ] Media y Moda se calculan
- [ ] Historial despachados (día/mes) visible en admin
- [ ] Historial despachados (día/mes) visible en cocina
- [ ] CRUD de usuarios funciona
- [ ] CRUD de productos funciona
- [ ] Descuentos se pueden crear
- [ ] Configuración se guarda
- [ ] Retención de historial configurable desde admin
- [ ] Limpieza automática de historial aplicada según retención

---

## 🚀 Próximas Mejoras Sugeridas

1. **Router de Órdenes**: Para gestionar pedidos
2. **Notificaciones**: Toast/Snackbar en tiempo real
3. **Reportes**: Exportar a PDF/Excel
4. **Análisis Avanzados**: Más gráficos y filtros
5. **Sistema de Auditoría**: Historial de cambios
6. **Dark Mode**: Tema oscuro
7. **Integración WebSocket**: Updates en tiempo real

---

## 📞 Soporte

Si algo no funciona:
1. Revisa consola del navegador (F12)
2. Revisa logs del backend
3. Verifica variables de entorno
4. Asegúrate que BD esté corriendo

---

Generado: 11 de Marzo, 2026
