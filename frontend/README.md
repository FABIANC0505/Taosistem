# RestauTech - Panel de Administración (Frontend)

Panel de administración completo para gestionar un restaurante con gráficos, métricas y análisis de datos.

## 🎨 Características

- **Dashboard con Métricas**: Visualiza KPIs en tiempo real
- **Gráficos Avanzados**: Análisis con Chart.js
  - Tendencia de ingresos (Media y Moda)
  - Productos más vendidos
  - Distribución de ingresos
- **Gestión de Usuarios**: CRUD completo con roles (Admin, Mesero, Cocina)
- **Gestión de Productos**: Crear, editar, eliminar productos con imágenes
- **Sistema de Descuentos**: Crear y gestionar promociones
- **Configuración**: Ajusta la información del restaurante
- **Autenticación Segura**: Login con JWT
- **Interfaz Responsiva**: Diseño mobile-first con Tailwind CSS
- **Iconografía Moderna**: Lucide Icons

## 🛠️ Tecnologías

- **React 18** - Librería de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool rápido
- **React Router** - Enrutamiento
- **Chart.js + Recharts** - Gráficos
- **Tailwind CSS** - Estilos
- **Axios** - Cliente HTTP
- **Lucide React** - Iconos

## 📦 Instalación

1. **Instalar dependencias**:
```bash
npm install
```

2. **Configurar variables de entorno**:
```bash
cp .env.example .env
```

Edita `.env` y configura la URL del backend:
```
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=RestauTech Admin
```

En produccion, por ejemplo en Vercel, debes definir `VITE_API_URL` desde el dashboard con la URL publica real del backend. Si no lo haces, el frontend compilara, pero login, datos e imagenes no funcionaran correctamente.

3. **Iniciar servidor de desarrollo**:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🚀 Scripts

```bash
npm run dev      # Iniciar desarrollo
npm run build    # Compilar para producción
npm run preview  # Vista previa de build
npm run lint     # Linting con TypeScript
```

## 📁 Estructura del Proyecto

```
src/
├── components/       # Componentes reutilizables
│   ├── AdminLayout.tsx
│   ├── Navbar.tsx
│   ├── Sidebar.tsx
│   └── ProtectedRoute.tsx
├── pages/           # Páginas principales
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── UsuariosPage.tsx
│   ├── ProductosPage.tsx
│   ├── DescuentosPage.tsx
│   └── ConfiguracionPage.tsx
├── services/        # Servicios API
│   ├── authService.ts
│   ├── userService.ts
│   ├── productService.ts
│   └── metricsService.ts
├── types/          # Tipos TypeScript
├── hooks/          # Hooks personalizados
├── styles/         # Estilos globales
└── utils/          # Utilidades
    └── api.ts      # Cliente Axios configurable
```

## 🔐 Autenticación

- Sistema JWT basado en tokens
- Token almacenado en localStorage
- Interceptors para manejo automático de autenticación
- Redirección automática en caso de sesión expirada

## 📊 Gráficos y Métricas

### Dashboard incluye:
- **KPI Cards**: Ingresos totales, órdenes, productos agotados
- **Tendencia de Ingresos**: Gráfico de línea con Media y Moda
- **Top Productos**: Gráfico de barras con cantidad e ingresos
- **Producto Más Vendido**: Tarjeta destacada
- **Estadísticas**: Media y Moda de ingresos calculadas en backend

## 🔌 Integración con Backend

El frontend se conecta automáticamente con los endpoints del backend en:

```
http://localhost:8000
```

**Endpoints requeridos**:
- `POST /auth/login` - Autenticación
- `GET /metrics/dashboard` - Métricas generales
- `GET /metrics/income-trends` - Tendencia de ingresos
- `GET /metrics/top-products` - Productos top
- `GET /users` - Lista de usuarios
- `GET /products` - Lista de productos
- etc.

## 🎯 Rutas

| Ruta | Descripción |
|------|-------------|
| `/login` | Página de inicio de sesión |
| `/admin` | Dashboard principal |
| `/admin/usuarios` | Gestión de usuarios |
| `/admin/productos` | Gestión de productos |
| `/admin/descuentos` | Gestión de descuentos |
| `/admin/configuracion` | Configuración del restaurante |

## 🌐 Responsive Design

- **Mobile First**: Optimizado para dispositivos móviles
- **Tablet**: Interfaz adaptada
- **Desktop**: Experiencia completa
- **Toggle Sidebar**: En móvil se colapsa automáticamente

## 🐛 Troubleshooting

### Error de CORS
Si obtienes errores CORS, asegúrate de que el backend está configurado con CORS:
```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### API no responde
Verifica que:
1. El backend está ejecutándose en `http://localhost:8000`
2. La URL está correcta en `.env`
3. No hay firewall bloqueando la conexión

## 📝 Componentes Principales

### ProtectedRoute
Componente que protege rutas requiriendo autenticación y rol específico.

### AdminLayout
Layout wrapper que proporciona Navbar y Sidebar.

### Navbar
Barra superior con nombre del usuario y botón de logout.

### Sidebar
Menú lateral con navegación y enlaces activos.

## 💡 Próximas Mejoras

- [ ] Sistema de notificaciones en tiempo real
- [ ] Reportes exportables (PDF, Excel)
- [ ] Dark mode
- [ ] Más gráficos y análisis
- [ ] Sistema de auditoría
- [ ] Integración con sistema de pedidos

## 📄 Licencia

Privado - RestauTech 2024
