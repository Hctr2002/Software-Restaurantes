# Memoria del Proyecto: Software-Restaurantes

## 1. RESUMEN EJECUTIVO

Estandarización del proyecto `Software-Restaurantes` de Héctor Robledo dentro del ecosistema OLYMP-IA.

## 2. DECISIONES CLAVE (ADRs)

- **ADR-001: Adopción de Monorepo.** Se reconoce la estructura Monorepo basada en Turbo y pnpm/npm.
- **ADR-002: Sincronización Manual.** Debido a restricciones de entorno (Git Terminal Prompt 0), el `git pull` inicial falló; se delega la sincronización al usuario.

## 3. CONVENCIONES VIVAS

- Seguir la Constitución OLYMP-IA V2.2.0.
- Los cambios estructurales requieren aprobación vía `implementation_plan.md`.

## 4. ESTADO DEL PROYECTO

- **2026-04-14:** Proyecto estandarizado. Fase de Sincronización pendiente de confirmación manual.
- **2026-04-14 (06:47):** Migración de interfaces premium sanitizadas (v1.1.0) a la carpeta `/mockups`. Rebranding a "MENU BITES" y lenguaje en español completado.
- **2026-04-27:** Implementación de nueva aplicación `local-dashboard` (administrador de local, rol ADMIN) en rama `feature/front_admin_local`. Adición de rol `CAJERO` al store compartido. Generación de 22 archivos fuente bajo `apps/local-dashboard/` siguiendo el UX/UI de `admin-dashboard`.
- **2026-04-27:** Corrección y rebuild de `kitchen-kds` (puerto 3001, rama `feature/front_kds`): eliminación de `proxy.ts` y `middleware.ts`, reescritura como componente inteligente sin redirects. Solución definitiva al bucle infinito por sesiones compartidas en localhost.
- **2026-04-28:** Creación de `cashier-dashboard` (puerto 3004, rol CAJERO, rama `feature/front_cajero`). POS en tiempo real con tabs "Por Cobrar" e "Historial", PaymentModal slide-over, suscripción Supabase para pedidos READY.
- **2026-04-28:** Enriquecimiento de `local-dashboard` (rama `feature/front_admin_local`): KPIs financieros (ingresos día/mes, ticket promedio), grilla visual de mesas, top items del día, gestión operacional de pedidos con modal de detalle y cambio de estado, CRUD de categorías de menú, sección de reportes (ventas 7 días, top 10 items, ingresos por mesa). Corrección de middleware para validar rol ADMIN y bloquear acceso a sesiones de otros roles.

- **2026-05-01 — Rama `feature/front_admin_local`:** Sesión de corrección de bugs críticos y expansión funcional del `local-dashboard`:
  - **Bug fix (BD):** Columnas `id` de `categories`, `tables`, `menu_items` e `inventories` carecían de `DEFAULT gen_random_uuid()` al ser creadas con `prisma db push`. Corregido con `ALTER TABLE ... SET DEFAULT gen_random_uuid()::text`.
  - **Bug fix (API):** `tables/route.ts` usaba status inválido `"AVAILABLE"` y omitía `qr_data` requerido. Corregido: status `"FREE"` + generación automática de `qr_data`.
  - **Bug fix (API):** `menu/route.ts` ignoraba `category_id` e `image_url` en POST y PUT. Corregido en ambos endpoints.
  - **Imagen de productos:** Bucket `menu-images` creado en Supabase Storage con políticas RLS. Modal de menú con zona de upload, preview y limpieza de imagen. Thumbnail en listado.
  - **Garzón en pedidos:** Columna `user_id` agregada a `orders` (SQL + índice). API actualizada con join a `users(email)`. Página de pedidos muestra columna Garzón; modal de detalle incluye tarjeta del garzón.
  - **Ranking de garzones:** Nueva sección en `reports/page.tsx` con medallas #1/#2/#3, pedidos atendidos e ingresos por garzón.
  - **Módulo de Inventario:** CRUD completo — `api/local/inventory/` (GET/POST/PUT/DELETE) + `dashboard/inventory/page.tsx` con badges de stock (OK / Stock bajo / Agotado) y alerta de quiebre. Nav item `Inventario` agregado en `LocalShell.tsx`.
  - **Toggle rápido de platos:** Botón Power en cada fila del menú para deshabilitar/habilitar `is_active` sin abrir modal (uso ante quiebre de stock).
  - **Análisis de ventas configurable:** Selector de período con presets 7/14/30/90 días + rango personalizado con date pickers. API de orders actualizada con parámetros `?to=` y `?limit=` (hasta 2000 registros).
  - **Exportación XML:** Botón "Exportar XML" genera `.xls` en formato SpreadsheetML compatible con Excel y Google Sheets, con hojas: Ventas por Día, Ranking Garzones, Top Items, Ingresos por Mesa.

- **2026-05-02 — Rama `feature/front_admin_local`:** Sesión de seguridad, routing multi-tenant y sistema de alertas en tiempo real:
  - **Slug dinámico:** Todas las páginas de `local-dashboard` migradas de `app/dashboard/` a `app/[slug]/dashboard/`. `LocalShell.tsx` usa `useParams()` para construir los href de navegación. El middleware valida que el slug de la URL coincida con el restaurante del JWT y corrige automáticamente si no coincide.
  - **Seguridad de rutas:** Middlewares creados para `kitchen-kds` (solo COCINA), `waiter-terminal` (solo GARZON), `admin-dashboard` (SUPER_ADMIN en `/dashboard/**`; otros roles redirigidos a su app) y `cashier-dashboard` (solo CAJERO). Todos redirigen a `NEXT_PUBLIC_AUTH_URL` (puerto 3000) ante sesión inválida.
  - **Sign-out universal:** `LocalShell.tsx` y `DashboardShell.tsx` usan `window.location.href` en vez de `router.replace()` para garantizar redirección cross-origin al puerto 3000.
  - **Login con slug:** Ambos login pages (admin-dashboard y local-dashboard) consultan `restaurants.slug` post-autenticación para el rol ADMIN y redirigen a `/{slug}/dashboard`.
  - **Sistema de alertas en tiempo real:** Tabla `alerts` en Supabase con RLS por `restaurant_id`. Helper `sendAlert()` publicado en `@menu-bites/auth`. Panel `AlertsPanel.tsx` en `LocalShell` con campana + badge rojo, suscripción Supabase Realtime, sonido de notificación y acciones por tipo: deshabilitar plato, ir a inventario/pedidos, resolver.
  - **Alertas en kitchen-kds:** Botón "Alerta Stock" → modal para enviar `STOCK_SHORTAGE` con nombre de plato/ingrediente.
  - **Alertas en waiter-terminal:** Botón alerta → modal con 4 tipos (TABLE_ISSUE, BILL_REQUEST, HELP_REQUEST, GENERAL) y n° de mesa opcional.
  - **Nueva app cashier-dashboard:** Puerto 3004, rol CAJERO. Muestra pedidos READY en tiempo real via Supabase Realtime. Acción "Cobrado → Marcar entregado" (transición READY → DELIVERED). Botón de alerta tipo BILL_REQUEST al administrador. Middleware de protección incluido.

## 5. INCIDENTES REGISTRADOS

- **Incidente 02:25:00:** `fatal: could not read Username for 'https://github.com'`. Bloqueo de Git Pull por autenticación en entorno no interactivo.

- **2026-05-02 — Merge `feature/customer-portal-setup` → `feature/front_admin_local`:**
  - Incorporación de `apps/customer-portal`: portal QR multi-tenant para comensales.
  - Rutas dinámicas `[restaurantSlug]/[tableNumber]`, API de órdenes, TenantContext, cliente Supabase.
  - 25 archivos nuevos, +1,672 líneas. Merge sin conflictos (estrategia `ort`).

## 6. VAULT SYNC LOG — FLUJO-059 / FLUJO-076

| RunID | Timestamp ISO-8601 | Archivos Sincronizados | Estado |
| --- | --- | --- | --- |
| RUN-20260502-007 | 2026-05-02T01:21:00-04:00 | 4 (PR_ADMIN_LOCAL, PR_DETALLE_KDS, PR_TEXTO_GITHUB, REPORTE_2026-04-29) + 1 nota de merge | ✅ COMPLETED |

```json
{"timestamp":"2026-05-02T01:21:00-04:00","event":"vault_sync_completed","data":{"files_synced":5,"canvas_updated":false,"vault_path":"/home/alejandro/Olymp-ia/projects/PROJ-Software-restaurante-Duoc/Software-Restaurantes/markdown","run_id":"RUN-20260502-007","ecosystem_version":"2.7.2"}}
```

## 7. FLIGHT LOG — ZENITH SESSIONS

| RunID | Timestamp ISO-8601 | WorkflowID | Agente | Estado |
| --- | --- | --- | --- | --- |
| RUN-20260414-001 | 2026-04-14T20:20:39-04:00 | FLUJO-000 / /zenith | 00_Zenith | 🟢 PRE-FLIGHT OK — Auditoría de Estado en curso |
| RUN-20260421-002 | 2026-04-21T20:23:45-04:00 | FLUJO-000 / /zenith | 00_Zenith | 🔴 BLOCKED — Auth Failure (Develop/Frontend) |
| RUN-20260421-003 | 2026-04-21T21:06:00-04:00 | FLUJO-000 / /zenith | 00_Zenith | 🟢 COMPLETED — Rama feature/front_superadmin creada localmente |
| RUN-20260428-004 | 2026-04-28T20:53:00-04:00 | FLUJO-000 / /zenith | 00_Zenith | 🟡 IN_PROGRESS — Actualización y Merge de develop |
| RUN-20260501-005 | 2026-05-01T00:00:00-04:00 | feature/front_admin_local | 03_Ejecutor | ✅ COMPLETED — Bug fixes BD + expansión funcional local-dashboard |
| RUN-20260502-006 | 2026-05-02T00:00:00-04:00 | feature/front_admin_local | 03_Ejecutor | ✅ COMPLETED — Slug dinámico, middlewares de seguridad, sistema de alertas Realtime, cashier-dashboard |
| RUN-20260502-007 | 2026-05-02T01:21:00-04:00 | FLUJO-059 + FLUJO-076 | 00_Zenith | ✅ COMPLETED — Merge customer-portal-setup + Vault Sync (5 archivos) |
| RUN-20260502-008 | 2026-05-02T02:03:10-04:00 | feature/customer-portal-setup | 03_Ejecutor | ✅ COMPLETED — Merge actualización: slug-routing centralizado + limpieza hardcodes (19 archivos) |

---
Desarrollado por OLYMP-IA · Supremacía Digital
