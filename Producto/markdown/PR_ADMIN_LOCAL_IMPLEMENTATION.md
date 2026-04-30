# Detalle del Pull Request: Implementación Local Dashboard (ADMIN)

## 1. RESUMEN DE CAMBIOS
Este Pull Request consolida la implementación de la nueva aplicación **Local Dashboard**, diseñada específicamente para el rol de `ADMIN` de local, permitiendo la gestión operativa completa del establecimiento. Además, se incluye una reestructuración organizativa del repositorio para mejorar la trazabilidad de la documentación.

## 2. COMPONENTES Y FUNCIONALIDADES NUEVAS

### Aplicación: `local-dashboard`
- **Dashboard Operativo:** Visualización de KPIs financieros en tiempo real (ingresos diarios/mensuales, ticket promedio).
- **Gestión de Pedidos:** Interfaz detallada para el seguimiento de pedidos, con capacidad de cambio de estado y visualización de productos.
- **Grilla de Mesas:** Representación visual del estado de las mesas del restaurante.
- **Gestión de Menú (CRUD):** Creación, edición y eliminación de categorías y platos del menú.
- **Reportes:** Generación de gráficos de ventas (últimos 7 días) y análisis de items más vendidos.

### Seguridad y Auth
- **Middleware:** Implementación de validación estricta de roles para asegurar que solo usuarios con rol `ADMIN` puedan acceder al dashboard local.
- **Store Compartido:** Integración del rol `CAJERO` en el estado global de la aplicación.

### Infraestructura y Documentación
- **Reorganización:** Migración de archivos fuente a la carpeta `Producto/` y centralización de informes en `markdown/`.
- **Actualización de Memoria:** Registro detallado de hitos en `memoria.md`.

## 3. IMPACTO TÉCNICO
- **Framework:** Next.js 14+ con App Router.
- **Estado:** Utiliza Supabase para suscripciones en tiempo real y persistencia.
- **Estética:** Alineación total con el sistema de diseño **Menu Bites** (Navy, Sage, Sand), eliminando cualquier rastro de la paleta terracota anterior.

## 4. INSTRUCCIONES DE VERIFICACIÓN
1. Iniciar el monorepo y navegar a la carpeta de `local-dashboard`.
2. Validar que el login redirija correctamente según el rol `ADMIN`.
3. Probar la creación de una nueva categoría en el menú y verificar su persistencia en la base de datos.
4. Verificar que el middleware bloquee el acceso si se intenta entrar con una sesión de `WAITER` o `KITCHEN`.

---
**Reportado por:** OLYMP-IA (Zenith)
**Estado del Repositorio:** Conflicto detectado en `apps/admin-dashboard/src/app/dashboard/plans/page.tsx` tras reorganización.
