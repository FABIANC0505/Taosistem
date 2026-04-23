# Analisis del Sistema RestauTech

## 1. Estado actual del proyecto

El repositorio no esta completamente migrado a Next.js. En este momento conviven tres piezas:

- `backend/`: sistema anterior en FastAPI.
- `frontend/`: cliente anterior en React + Vite.
- `taosistem/`: nueva implementacion en Next.js con rutas `app/` y APIs internas.

Esto significa que el proyecto esta en una etapa de transicion. El riesgo principal no es solo tecnico: tambien hay riesgo de confusion operativa porque la documentacion principal todavia describe la arquitectura vieja.

## 2. Lo que un stakeholder esperaria de este sistema

Desde negocio, un stakeholder normalmente espera que el sistema garantice lo siguiente:

- Inicio de sesion por roles.
- Operacion diaria sin caidas en horas pico.
- Registro confiable de pedidos.
- Flujo claro entre mesero, cocina, caja y administracion.
- Datos correctos para ventas, historial y metricas.
- Seguridad basica de usuarios y accesos.
- Evidencia de cambios, incidentes y mantenimiento.
- Facilidad para desplegar, respaldar y recuperar el sistema.

## 3. Modulos funcionales identificados

- Autenticacion.
- Gestion de usuarios.
- Gestion de productos.
- Gestion de pedidos.
- Flujo de cocina.
- Flujo de caja.
- Dashboard y metricas.
- Configuracion.
- Historial.
- Carga de imagenes.

## 4. Hallazgos tecnicos reales encontrados

Se valido el proyecto `taosistem/` con compilacion local usando `npm.cmd run build`.

### Bloqueos encontrados

1. Dependencias faltantes en `taosistem/package.json`
- El codigo usa librerias como `axios` y `lucide-react`, pero no estan declaradas.
- Impacto: el proyecto no compila.

2. Imports incompatibles con Next.js
- Hay archivos que usan patrones heredados de React Router, por ejemplo imports como `Link` o `Navigate` desde `next/navigation`.
- Impacto: errores de compilacion y navegacion rota.

3. Exportaciones mal conectadas
- Varias rutas `app/.../page.tsx` intentan importar componentes como si fueran `default export`, pero varios archivos en `pages/` exportan de forma nombrada.
- Impacto: multiples paginas no cargan.

4. CSS/Tailwind no compatible con la configuracion actual
- `taosistem/app/globals.css` usa clases con `@apply` que el compilador actual esta rechazando.
- Impacto: la app falla durante el build.

5. Dependencia de fuentes externas
- `app/layout.tsx` intenta descargar fuentes Google en build.
- Impacto: en entornos sin internet o con restricciones, el build falla.

6. Documentacion desalineada
- El `README.md` raiz describe FastAPI + React.
- `taosistem/README.md` sigue siendo el archivo generico de create-next-app.
- Impacto: onboarding lento, errores de despliegue y decisiones equivocadas.

7. Codigo provisional o incompleto
- Se detecto al menos un comentario de `dummy history for now`.
- Impacto: algunas funciones pueden devolver datos no finales o parciales.

8. Configuracion sensible debil
- `JWT_SECRET_KEY` tiene fallback inseguro (`change-me-in-production`).
- Impacto: riesgo de seguridad si se despliega sin variables correctas.

## 5. Escenarios en los que el sistema puede dejar de funcionar

### Escenario A. La aplicacion no compila

Posibles causas:

- Dependencias no instaladas o no declaradas.
- Imports incorrectos para Next.js.
- Errores de exportacion entre `app/` y `pages/`.
- CSS incompatible con Tailwind/Next actual.

Solucion:

- Normalizar `package.json`.
- Corregir imports de navegacion.
- Unificar `default export` o imports nombrados.
- Simplificar y validar `globals.css`.
- Confirmar que `npm run build` termine sin errores.

### Escenario B. El login falla

Posibles causas:

- Base de datos no disponible.
- `DATABASE_URL` incorrecta.
- `JWT_SECRET_KEY` ausente o inconsistente.
- Usuario inactivo.
- Diferencias entre el esquema esperado y la tabla real.

Solucion:

- Validar variables de entorno al inicio.
- Crear una lista minima de chequeos de arranque.
- Agregar mensajes de error mas claros.
- Verificar la estructura real de la tabla `users`.

### Escenario C. Las paginas cargan pero las APIs internas fallan

Posibles causas:

- Queries SQL incompatibles con la base real.
- Tablas incompletas o datos mal migrados.
- Token ausente o vencido.
- Cambios de rol no reflejados en sesion.

Solucion:

- Probar endpoint por endpoint.
- Crear validaciones de arranque de base de datos.
- Revisar manejo de token en cliente y servidor.
- Documentar el contrato de cada endpoint.

### Escenario D. No se registran pedidos correctamente

Posibles causas:

- Estructura incorrecta del arreglo `items`.
- Productos inexistentes o sin precio valido.
- Caida parcial al guardar pedido.
- Estados de pedido mal controlados.

Solucion:

- Validar payload antes de insertar.
- Verificar existencia y disponibilidad de productos.
- Definir transiciones validas de estados.
- Crear pruebas minimas del flujo completo.

### Escenario E. Cocina o caja ven informacion incorrecta

Posibles causas:

- Filtros de roles mal aplicados.
- Polling sin control.
- Endpoint de historial incompleto o provisional.
- Datos viejos en cliente.

Solucion:

- Revisar RBAC de cada endpoint.
- Confirmar politicas de refresco.
- Corregir endpoints temporales.
- Añadir indicadores de ultimo refresco y errores.

### Escenario F. Fallan imagenes de productos

Posibles causas:

- Escritura de archivos en rutas no persistentes.
- Falta de permisos.
- URLs publicas mal construidas.
- Archivos perdidos al desplegar.

Solucion:

- Documentar estrategia de almacenamiento.
- Evitar depender solo de disco local en produccion.
- Validar tamano y tipo de archivo.
- Considerar almacenamiento externo si se despliega en infraestructura efimera.

### Escenario G. El sistema se rompe despues de desplegar

Posibles causas:

- Variables de entorno distintas a desarrollo.
- Build con acceso restringido a internet.
- Base de datos remota no accesible.
- Diferencias entre Windows local y Linux en produccion.

Solucion:

- Eliminar dependencias innecesarias a recursos externos en build.
- Crear checklist de despliegue.
- Estandarizar variables requeridas.
- Probar build local de produccion antes de desplegar.

### Escenario H. El sistema parece funcionar pero el negocio pierde control

Posibles causas:

- Sin respaldos.
- Sin trazabilidad de cambios.
- Sin auditoria minima.
- Sin manual operativo por rol.

Solucion:

- Documentar procesos criticos.
- Definir politicas de backup y recuperacion.
- Registrar cambios funcionales.
- Crear guias por rol.

## 6. Prioridad recomendada de trabajo

### Fase 1. Estabilizacion tecnica minima

- Hacer que `taosistem` compile.
- Corregir dependencias, imports, exports y estilos base.
- Alinear README tecnico con el estado real.

### Fase 2. Validacion funcional

- Probar login.
- Probar CRUD de productos.
- Probar flujo de pedidos por rol.
- Probar cocina, caja, historial y metricas.

### Fase 3. Endurecimiento operativo

- Variables obligatorias.
- Manejo de errores.
- Validaciones de datos.
- Seguridad minima.
- Estrategia de archivos e imagenes.

### Fase 4. Documentacion de negocio y operacion

- Manual tecnico.
- Manual funcional por rol.
- Checklist de despliegue.
- Catalogo de incidentes y recuperacion.

## 7. Recomendacion profesional inmediata

No conviene seguir agregando funcionalidades nuevas hasta que la app Next.js compile y sus rutas base funcionen. La siguiente mejor accion es corregir los bloqueos de compilacion del proyecto `taosistem`, porque mientras eso no ocurra no hay una base estable para migrar el sistema anterior.

## 8. Siguiente paso propuesto

La siguiente iteracion deberia enfocarse en:

- Dependencias faltantes.
- Imports de navegacion incompatibles.
- Exportaciones incorrectas entre `app/` y `pages/`.
- Ajustes base de estilos para que el build termine.

Cuando hagamos esa modificacion, se agregara un nuevo README dentro de `docs/cambios/` explicando exactamente que se corrigio y para que sirve.
