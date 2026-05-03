# Pull Request: Admin Local Dashboard — Implementación Pro

Esta PR consolida la transformación del ecosistema **Menu Bites**, integrando el panel de administración local con arquitectura multitenant, nuevas aplicaciones de soporte de roles, sistema de alertas en tiempo real y comunicación bidireccional entre perfiles.

---

## Resumen de Módulos Modificados

| Aplicación | Puerto | Función Principal | Estado |
|:---|:---:|:---|:---:|
| `local-dashboard` | 3003 | Admin de Restaurante (Gestión Total) | Pro |
| `cashier-dashboard`| 3004 | Panel de Cajero (Cobros y Entregas) | Nuevo |
| `customer-portal` | 3005 | Portal de Cliente (Menú QR y Pedidos) | Nuevo |
| `kitchen-kds` | 3001 | Pantalla de Cocina (Gestión de Pedidos) | Refactor |
| `waiter-terminal` | 3002 | Terminal de Mozo (Atención y Mesas) | Refactor |
| `mobile` | App | App de Super Admin (Gestión de Usuarios) | Sync |

---

## Arquitectura: Routing Multitenant por Slug

Se ha abandonado el uso de IDs hardcodeados. El sistema ahora opera bajo una arquitectura de **Tenancy basado en URL (Slug)**.

- **URL dinámicas**: Todas las rutas ahora siguen el patrón `/[slug]/dashboard/...`.
- **Detección de Tenant**: El `slug` se extrae de la URL y se valida contra el `restaurant_id` del token JWT del usuario.
- **Seguridad**: Si un usuario intenta acceder al slug de un restaurante que no le pertenece, el middleware lo bloquea y lo redirige a su propio dashboard.
- **Configuración centralizada**: No se requieren variables de entorno específicas por restaurante; todo se resuelve dinámicamente desde Supabase.

---

## local-dashboard — Cambios Detallados

### Autenticación y Seguridad
- **Middleware Proxy**: Reemplazo del middleware estándar por un `proxy.ts` robusto que valida tokens de Supabase y roles (`ADMIN`, `CAJERO`, `SUPER_ADMIN`).
- **Universal Login**: Página de login unificada que detecta el restaurante del usuario y lo redirige al slug correcto.

### Gestión de Menú (/[slug]/dashboard/menu)
- **CRUD Refactorizado**: Implementación de `menuService` con validación estricta via **Zod**.
- **Imágenes Dinámicas**: Integración con Supabase Storage (Bucket `menu-images`). Soporte de upload, preview y borrado.
- **Control de Stock Rápido**: Toggle de activación/desactivación instantánea de platos desde el listado.

### Gestión de Mesas (/[slug]/dashboard/tables)
- **QR Dinámico**: Generación automática de códigos QR por mesa que apuntan a `customer-portal/{slug}/{mesa}`.
- **Descarga de Assets**: Botón para descargar el código QR de la mesa para impresión.
- **Estados en Vivo**: Sincronización de estados `LIBRE`, `OCUPADA`, `RESERVADA`.

### Módulo de Inventario (/[slug]/dashboard/inventory) — NUEVO
- Control de stock con alertas visuales (OK / Stock Bajo / Agotado).
- Definición de mínimos para disparo de alertas automáticas al administrador.

### Sistema de Alertas (AlertsPanel.tsx) — NUEVO
- Panel lateral persistente en el dashboard admin.
- Suscripción a Supabase Realtime para recibir notificaciones instantáneas de:
  - **Llamados de mesa** (desde `waiter-terminal`).
  - **Falta de stock** (desde `kitchen-kds`).
  - **Solicitud de cuenta** (desde `cashier-dashboard`).
- Sonido de notificación y badges de conteo.

---

## Comunicación entre Perfiles (Workflow)

El flujo de información ahora es circular y en tiempo real:

1. **Cliente**: Escanea QR → `customer-portal` → Realiza pedido.
2. **Sistema**: Persiste orden en BD → Dispara alerta a **Cocina** (`kitchen-kds`) y **Admin** (`local-dashboard`).
3. **Mozo**: Gestiona mesa en `waiter-terminal` → Envía alerta de "Problema en mesa" al **Admin**.
4. **Cocina**: Marca pedido como "Listo" → Notifica al **Cajero** (`cashier-dashboard`).
5. **Cajero**: Recibe notificación → Procesa pago → Cierra la orden.
6. **Admin**: Visualiza el KPI de venta actualizado en sus reportes en tiempo real.

---

## Pendientes y Próximos Pasos

- **Real-time Estricto**: Actualmente las alertas usan una mezcla de polling y realtime. Migrar 100% a canales de Supabase.
- **Exportación de Datos**: Completar la lógica de exportación a PDF para reportes contables.
- **Optimización de Imágenes**: Implementar compresión del lado del cliente antes de subir al bucket.
- **PWA**: Habilitar modo Offline para el portal de clientes en zonas de baja señal.

---
**Branch:** `feature/front_admin_local`
**RunID:** `RUN-20260502-FINAL`
**Estado:** Listo para Merge a `develop`
