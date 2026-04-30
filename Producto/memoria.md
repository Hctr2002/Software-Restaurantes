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

- **2026-04-29:** Corrección de aliases PostgREST invertidos en `local-dashboard` (rutas `/api/local/orders` y `/api/local/menu`). La sintaxis correcta es `alias:columna_real`; los campos afectados eran `menuItemId`, `unitPrice`, `tableId` y `categoryId`.
- **2026-04-29:** Centralización de autenticación en `localhost:3000` (admin-dashboard). Se actualizó el middleware de `local-dashboard` para redirigir usuarios sin sesión o rol incorrecto a `NEXT_PUBLIC_AUTH_URL` en lugar de a su propio login. Se eliminó el formulario de login de `local-dashboard/page.tsx`. Se crearon middlewares reales (`middleware.ts`) para `kitchen-kds` (guard COCINA) y `waiter-terminal` (guard GARZON), reemplazando los archivos `proxy.ts` inactivos. Se añadió `@supabase/ssr` como dependencia directa en ambas apps.
- **2026-04-29:** Implementación de panel de Configuración KDS en `kitchen-kds`. Nuevo `SettingsModal` con 5 secciones: (1) Umbrales de Alerta con color coding verde/amarillo/rojo configurable por minutos, (2) Tiempos de Preparación por Categoría, (3) Alertas Sonoras toggle por tipo (nuevo ticket / alerta crítica), (4) Auto-borrado de comandas listas tras N segundos, (5) Gestión "Sin Stock" (86 items) con toggle inmediato en Supabase. Settings persistidos en `localStorage` por dispositivo. Se extrajeron tipos y helpers a `src/lib/kdsSettings.ts`. Se eliminaron animaciones (`animate-in`, `animate-pulse`) del componente `OrderTicket` en `packages/ui`.

## 5. INCIDENTES REGISTRADOS

- **Incidente 02:25:00:** `fatal: could not read Username for 'https://github.com'`. Bloqueo de Git Pull por autenticación en entorno no interactivo.

## 6. FLIGHT LOG — ZENITH SESSIONS

| RunID | Timestamp ISO-8601 | WorkflowID | Agente | Estado |
| :-- | :-- | :-- | :-- | :-- |
| RUN-20260414-001 | 2026-04-14T20:20:39-04:00 | FLUJO-000 / /zenith | 00_Zenith | 🟢 PRE-FLIGHT OK — Auditoría de Estado en curso |
| RUN-20260421-002 | 2026-04-21T20:23:45-04:00 | FLUJO-000 / /zenith | 00_Zenith | 🔴 BLOCKED — Auth Failure (Develop/Frontend) |
| RUN-20260421-003 | 2026-04-21T21:06:00-04:00 | FLUJO-000 / /zenith | 00_Zenith | 🟢 COMPLETED — Rama feature/front_superadmin creada localmente |
| RUN-20260428-004 | 2026-04-28T20:53:00-04:00 | FLUJO-000 / /zenith | 00_Zenith | 🟡 IN_PROGRESS — Actualización y Merge de develop |

| RUN-20260429-005 | 2026-04-29T23:22:00-04:00 | FLUJO-000 / /zenith | 00_Zenith | 🟢 PRE-FLIGHT OK — Iniciando actualización de rama feature/front_kds |

---
Desarrollado por OLYMP-IA · Supremacía Digital
