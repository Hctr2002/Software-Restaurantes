# Testing — Menu Bites

Guía de la suite de tests del monorepo. Tres niveles: **unitario/integración** (Vitest),
**base de datos** (pgTAP) y **end-to-end** (Playwright).

## Resumen

| Nivel | Herramienta | Tests | Comando |
|-------|-------------|-------|---------|
| Unitario / integración | Vitest | **843** (12 workspaces) | `npm test` |
| Base de datos (RLS + triggers) | pgTAP | **23** | `npm run test:db` |
| End-to-end | Playwright | smoke | `npm run test:e2e` |

---

## 1. Unitario / integración (Vitest)

Cada workspace (`apps/*`, `packages/*`) tiene su propio `vitest.config.ts` y script `test`.

```bash
npm test                 # toda la suite vía turbo (con caché)
npm run test:packages    # solo packages (@menu-bites/*)

# Un workspace concreto:
cd packages/auth && npm test
cd apps/local-dashboard && npx vitest run src/__tests__/api-routes.test.ts   # un archivo
cd packages/ui && npm run test:watch                                          # modo watch
cd packages/auth && npm run test:coverage                                     # cobertura (v8)
```

### Qué cubre cada workspace

- **`@menu-bites/ui`** (358) — componentes React (Radix + Tailwind) con Testing Library.
- **`@menu-bites/auth`** (148) — hooks de dominio y utilidades. Incluye la lógica crítica:
  `useOrderHooks` (filtrado por estación KITCHEN/BAR, órdenes legacy), `useCashierHooks`
  (cierre de pedidos / caja), `useRealtimeSync` (suscripción Realtime, reintentos).
- **`@menu-bites/store`** (11) — estado Zustand cifrado.
- **apps** — rutas API (handlers reales, capa de datos mockeada): se valida gating de auth
  (401/403), validación de payload (400), happy path (200/201), 404/409 y errores (500).
  - `local-dashboard` (121) — las 18 rutas `/api/local/*` + lógica pura (`reportUtils`,
    `brandingUtils`, `services`).
  - `admin-dashboard` (33), `customer-portal` (25, incl. creación de pedido con split por
    estación), `waiter-terminal` (18, incl. Web Push), `kitchen-kds` / `bar-dashboard` (14 c/u),
    `cashier-dashboard` (12).
  - `mobile` (79) — utilidades puras (reportes, recibos, descubrimiento de API, dashboard).
- **`supabase/functions`** (10) — edge function `manage-users`.

### Patrón de mocks de Supabase

El query builder se imita con una **cadena thenable**: cada método encadenable
(`select`, `eq`, `in`, `order`, …) devuelve la misma cadena, y `chain.then` resuelve a un
`{ data, error }` configurable, de modo que `await query` funciona con cualquier profundidad.
Para hooks/servicios con varias queries se enruta la resolución por nombre de tabla.

---

## 2. Base de datos — RLS y triggers (pgTAP)

Tests SQL en `supabase/tests/` que corren con **pgTAP** contra una base Postgres local.
Requieren **Docker** y el stack de Supabase levantado.

```bash
# 1. Arrancar Docker Desktop, luego el stack local (aplica las migraciones):
supabase start

# 2. Ejecutar los tests pgTAP:
npm run test:db          # = supabase test db

# Al terminar, liberar recursos:
supabase stop
```

Cubren:
- **`order_transition_test.sql`** (17) — el trigger `validate_order_transition()`: estado
  inicial permitido, transiciones válidas/inválidas y estados terminales (COMPLETED/REJECTED),
  incluyendo el estado `PARCIAL`.
- **`rls_tenant_isolation_test.sql`** (6) — aislamiento multi-tenant en `orders`: cada
  restaurante solo ve y modifica sus propios pedidos (políticas `select_orders` / `update_orders`
  vía `get_auth_restaurant_id()`).

> ⚠️ **Nota de seguridad documentada en el test RLS:** la tabla `orders` tiene una política
> `insert_orders` con `WITH CHECK (true)` — los **INSERT no están restringidos por
> `restaurant_id`** (solo SELECT/UPDATE lo están). Confirmar si es intencional.

---

## 3. End-to-end (Playwright)

Specs en `e2e/`. Los servidores de dev **no** se arrancan automáticamente: hay que tenerlos
corriendo antes.

```bash
npm run dev              # levanta las apps Next.js
npm run test:e2e         # corre los specs (chromium + mobile-chrome)
npm run test:e2e:ui      # runner interactivo
```

`baseURL` por defecto: `http://localhost:3005` (customer-portal); configurable con `E2E_BASE_URL`.

Estado actual: specs **smoke** (`admin-login`, `customer-portal`) que verifican carga de páginas.
Un E2E del **flujo de pedido completo** (cliente → cocina → mesero → caja + redirección por rol)
requiere infraestructura adicional aún no provista en el repo:

- `supabase/seed.sql` con un restaurante demo (menú, mesas) y usuarios de auth por cada rol,
- `.env.local` por app apuntando al Supabase local (hoy las apps leen el `.env` raíz → remoto),
- los 7 servidores de dev levantados simultáneamente.

---

## Convenciones

- Los tests viven en `__tests__/` dentro de cada package/app (Vitest) y en `e2e/` (Playwright).
- Al agregar una ruta/util/hook nuevos, añadir su test en el `__tests__/` del mismo workspace.
- Entornos Vitest: `node` para lógica/rutas; `jsdom` para componentes y hooks de React
  (configurable por archivo con `// @vitest-environment jsdom`).
