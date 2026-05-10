# Pull Request — `feature/front_bar` → `develop`

**Título:** feat: integración completa del Bar Dashboard y arquitectura de sub-pedidos independientes por estación (v2.5.0)

**Rama origen:** `feature/front_bar`
**Rama destino:** `develop`
**Fecha:** 2026-05-10
**Autor:** cucholambreta

---

## Resumen Ejecutivo

Esta rama implementa la estación de **Bar Dashboard** como una aplicación KDS completamente funcional e independiente del Kitchen KDS. El cambio arquitectónico central es el modelo de **sub-pedidos por estación**: en lugar de un único pedido con flags booleanos de coordinación entre cocina y barra, cada pedido ahora pertenece a exactamente una estación (`KITCHEN` o `BAR`). Esto elimina el acoplamiento de estado entre dashboards y simplifica toda la lógica de preparación.

**Impacto:** 129 archivos modificados · +4.386 líneas añadidas · −1.028 líneas eliminadas · 16 commits

---

## 1. Nuevas Funcionalidades

### 1.1 Bar Dashboard (`apps/bar-dashboard`) — App KDS nueva

Nueva aplicación Next.js 16 completamente operativa para el personal de barra, con paridad funcional respecto al Kitchen KDS:

| Elemento | Detalle |
|---|---|
| Puerto de desarrollo | `3006` |
| Rol requerido | `BAR` (JWT `app_metadata`) |
| Hook de datos | `useBarOrders` — filtra pedidos con `station = 'BAR'` |
| Ciclo de vida | VALIDATED → PREPARING → READY, independiente de cocina |
| Diseño | Estilo Pro Max con `bar-gradient`, paleta púrpura, `GlassWater` como icono |
| Auth | Proxy propio (`src/proxy.ts`) que valida rol `BAR` |
| Slug routing | `[slug]/page.tsx` mapea el tenant sin parámetros de URL |
| Settings KDS | Umbrales, sonidos y auto-clear configurables por separado |
| Stock Alerts | `StockAlertModal` integrado para reportar faltantes desde la barra |

**Archivos nuevos:**
```
apps/bar-dashboard/
  package.json · next.config.mjs · tailwind.config.ts · tsconfig.json
  vercel.json · postcss.config.js · public/sw.js
  src/app/layout.tsx · page.tsx · login/page.tsx
  src/app/[slug]/page.tsx · auth/callback/page.tsx
  src/app/_components/SettingsModal.tsx · StockAlertModal.tsx
  src/lib/kdsSettings.ts
  src/proxy.ts
```

### 1.2 Arquitectura de Sub-pedidos por Estación

**Antes:** Un único pedido con todos los ítems (cocina y barra mezclados) + flags `kitchen_ready`, `bar_ready`, `kitchen_preparing`, `bar_preparing` para coordinar el estado entre dashboards. Cualquier actualización de estado en un KDS afectaba al otro.

**Ahora:** Cada pedido pertenece a exactamente una estación. Un pedido con ítems de ambas estaciones genera dos registros independientes en `orders`:

```
POST /api/orders { items: [Hamburguesa (KITCHEN), Jugo (BAR)] }
→ INSERT orders { station: 'KITCHEN', items: [Hamburguesa] }          → id: A
→ INSERT orders { station: 'BAR', parent_order_id: A, items: [Jugo] } → id: B
→ Response: { id: A, orderIds: [A, B] }
```

Cada sub-pedido tiene su propio ciclo VALIDATED → PREPARING → READY sin interferencia cruzada.

---

## 2. Cambios en Base de Datos

### 2.1 Migración 0009 — `order_station_split.sql`

```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS station TEXT
  CHECK (station IN ('KITCHEN', 'BAR'));

ALTER TABLE orders ADD COLUMN IF NOT EXISTS parent_order_id UUID;

CREATE INDEX IF NOT EXISTS idx_orders_station ON orders (station);
CREATE INDEX IF NOT EXISTS idx_orders_parent_order_id ON orders (parent_order_id);

-- Backfill de pedidos históricos con un solo tipo de ítem
UPDATE orders o SET station = subq.station
FROM (
  SELECT oi.order_id,
         MIN(c.target_station) AS station,
         COUNT(DISTINCT c.target_station) AS station_count
  FROM order_items oi
  JOIN menu_items mi ON mi.id = oi.menu_item_id
  JOIN categories c ON c.id = mi.category_id
  GROUP BY oi.order_id
) subq
WHERE o.id = subq.order_id
  AND subq.station_count = 1
  AND o.status NOT IN ('DELIVERED', 'COMPLETED', 'REJECTED');
```

> **Nota técnica:** `parent_order_id` no tiene FK explícita por limitaciones de pgbouncer en modo pooler. La integridad referencial se gestiona a nivel de aplicación.

### 2.2 Prisma Schema actualizado

```prisma
model Order {
  // campos existentes ...
  station       String?  @map("station")          // 'KITCHEN' | 'BAR' | null (legacy)
  parentOrderId String?  @map("parent_order_id")  // enlace entre sub-pedidos
  @@index([station])
}
```

### 2.3 Eliminación de columnas legacy (solo lógica de aplicación)

Las columnas `kitchen_preparing`, `kitchen_ready`, `bar_preparing`, `bar_ready` se mantienen en BD para retrocompatibilidad con datos históricos pero ya no se escriben ni leen en el nuevo flujo. La lógica que dependía de ellas fue eliminada de `updateOrderStatus` y `useUserHooks`.

### 2.4 Ajustes en migraciones SQL

- `0001_initial_security.sql`: transición `READY → REJECTED` habilitada (necesaria para rechazar pedidos con error de preparación); comentarios explicativos en estados terminales.
- `0005_allow_cashier_completion.sql`: función renombrada de `validate_order_status_transition` a `validate_order_transition` para alinearla con el trigger original; añadido bloque `INSERT` que valida que pedidos nuevos empiecen en `PENDING`; se recrea el trigger `tr_order_status_validation`.

---

## 3. Cambios en Paquetes Compartidos

### 3.1 `@menu-bites/auth`

#### `src/index.ts` — `updateOrderStatus`
Simplificado de ~60 líneas con lógica cross-station a 12 líneas de UPDATE directo:

```typescript
export const updateOrderStatus = async (orderId: string, status: string) => {
  const payload: Record<string, unknown> = { status };
  const timestampField = STATUS_TIMESTAMP[status]; // validated_at, preparing_at, ready_at
  if (timestampField) payload[timestampField] = new Date().toISOString();
  return supabase.from("orders").update(payload).eq("id", orderId).select();
};
```

#### `src/types.ts`
- Añadidos `station: 'KITCHEN' | 'BAR' | null` y `parentOrderId: string | null` a la interfaz `Order`.

#### `src/utils.ts` — `mapOrder`
- Mapeo de `o.station` y `o.parent_order_id` a los nuevos campos camelCase.
- Mapeo de `menuItem.category.targetStation` para OrderItems.

#### `src/hooks/useOrderHooks.ts`
- `useRealtimeOrders`: filtro DB `OR station.eq.X,station.is.null` para manejar datos legacy.
- Transform corregido: ahora filtra tanto `order.order_items` (snake_case) como `order.orderItems` (camelCase) para pedidos legacy con `station IS NULL`, garantizando que cada KDS muestre solo sus ítems.
- `useKitchenOrders`: `station: 'KITCHEN'`, statuses `[VALIDATED, PREPARING, READY]`.
- `useBarOrders`: `station: 'BAR'`, statuses `[VALIDATED, PREPARING, READY]`.

#### `src/hooks/useUserHooks.ts`
- Nueva función `groupOrdersByTable`: agrega sub-pedidos del mismo `table_id` en una entrada unificada con ítems combinados para la vista del garzón.
- `pendingOrders`, `preparingOrders`, `readyOrders` calculados con agrupamiento → el garzón ve **1 tarjeta por mesa**, no 1 por sub-pedido.
- `handleValidate`: batch UPDATE de todos los sub-pedidos `PENDING` del mismo `table_id` en una sola sentencia.
- `handleReject`: batch UPDATE de todos los sub-pedidos `PENDING`/`VALIDATED` del mismo `table_id`.
- `handleDeliver`: batch UPDATE de todos los sub-pedidos `READY` del mismo `table_id`; eliminada lógica obsoleta de `PARCIAL`.

#### `src/hooks/useRealtimeSync.ts`
- Canal Realtime con nombre único por `channelId` para evitar colisiones entre hooks del mismo tabla.
- `transform` estabilizado con `useRef` para evitar recreación innecesaria de `performFetch`.

### 3.2 `@menu-bites/store`

- `UserIdentity.role`: añadido `'BAR'` al tipo union. Sin este cambio, el auth callback del Bar Dashboard no podía almacenar correctamente la sesión en Zustand.

### 3.3 `@menu-bites/ui`

#### `KDSColumn.tsx`
- Ajuste de estilos en columna activa: mayor contraste con `bg-foreground/[0.05]` y `shadow-primary/10` para compatibilidad con temas claros y oscuros.

#### `OrderTicket.tsx`
- Prop `type: 'KITCHEN' | 'BAR'` para renderizar estilos diferenciados (paleta naranja/primaria para cocina, paleta púrpura para barra).

#### `TableCard.tsx`
- Prop `orders?: any[]` para mostrar conteo de ítems activos directamente en la tarjeta de mesa.
- Badge "COCINA" renombrado a "PREPARANDO" (agnóstico de estación).

#### `ReadyOrdersBanner.tsx`
- Badges de estación ("Cocina" / "Bar" / "Cocina + Bar") derivados de `order.station` en lugar de los flags `kitchenReady`/`barReady`.
- Lógica de ítems parciales eliminada; se muestran todos los ítems del pedido agrupado.

#### `PreparingOrdersList.tsx`
- Lectura de `orderItems` (camelCase) con fallback a `order_items` para compatibilidad con pedidos agrupados y legacy.

### 3.4 `@menu-bites/auth` — `tsconfig.json`

Añadido `tsconfig.json` propio para el paquete, necesario para resolución correcta de tipos en modo `transpilePackages` de Next.js.

---

## 4. Cambios en Aplicaciones Existentes

### 4.1 `waiter-terminal` — Split de pedidos al crear

`handleSubmitOrder` en `tables/[id]/menu/page.tsx` refactorizado para replicar la lógica de split del customer portal:

```typescript
const categoryStationMap = new Map(categories.map(cat => [cat.id, cat.target_station]));
const itemStationMap = new Map(menu.map(item => [item.id, categoryStationMap.get(item.categoryId) ?? 'KITCHEN']));

const kitchenItems = cart.filter(i => itemStationMap.get(i.id) === 'KITCHEN');
const barItems     = cart.filter(i => itemStationMap.get(i.id) === 'BAR');

if (kitchenItems.length > 0) await createSubOrder(kitchenItems, 'KITCHEN');
if (barItems.length > 0)     await createSubOrder(barItems, 'BAR', kitchenOrderId);
```

Usa los datos de `useMenu` ya cargados (sin petición extra a la BD). Pedidos con ítems de un solo tipo siguen creando un único registro.

### 4.2 `customer-portal` — API `/api/orders`

`POST /api/orders` refactorizado con el mismo patrón de split:
- Dos queries explícitas (`menu_items` + `categories`) en lugar de join anidado.
- Crea sub-pedido KITCHEN primero, luego BAR con `parent_order_id` apuntando al primero.
- Responde con `{ id: primaryOrderId, orderIds: [kitchenId, barId] }`.

### 4.3 Auth callbacks — Todas las apps

`auth/callback/page.tsx` de todas las apps migrado para usar el cliente `supabase` compartido de `@menu-bites/auth` en lugar de instanciar `createBrowserClient` con variables de entorno locales, lo que causaba fallos en recompilaciones en frío.

### 4.4 `kitchen-kds`

- Eliminado comentario de rebuild trigger.
- `SettingsModal` cargado con `next/dynamic` para aislar el chunk de Turbopack y evitar el error recurrente de `module factory not available` (HMR stale module graph).

---

## 5. Documentación Actualizada

| Archivo | Cambios |
|---|---|
| `Documentacion/01_Documentacion/4.3_Arquitectura.md` | v2.5.0: nuevo diagrama de estados, secuencia de sub-pedidos, ADRs #7 y #8 |
| `Documentacion/DATABASE_SCHEMA.md` | Entidad ORDER actualizada, OrderStatus revisado, sección §6 migración 0009 |
| `Documentacion/API_SPECIFICATION.md` | Endpoint POST /api/orders con nuevo contrato de respuesta |
| `Documentacion/TECHNICAL_SAD.md` | Decisiones técnicas alineadas con v2.5.0 |
| `Documentacion/USER_MANUAL.md` / `Manual_Usuario.md` | Flujo de pedido actualizado para garzón y KDS dual |
| `Gestion/REPORTE_AVANCE_2026-05-10.md` | Reporte de sesión con tabla comparativa antes/después |

---

## 6. Checklist de Revisión

### Base de Datos
- [ ] Migración `0009_order_station_split.sql` ejecutada en el entorno destino
- [ ] Verificar que todos los pedidos activos tienen `station` asignado (o `NULL` aceptable para legacy)
- [ ] Confirmar que el índice `idx_orders_station` reduce el tiempo de consulta de los hooks KDS
- [ ] Revisar que la función `validate_order_transition` del trigger no rompe pedidos existentes

### Funcionalidad
- [ ] Pedido mixto (KITCHEN + BAR) desde el **customer portal** crea 2 sub-pedidos con IDs distintos
- [ ] Pedido mixto desde el **waiter terminal** crea 2 sub-pedidos correctamente
- [ ] **Kitchen KDS** muestra solo ítems `KITCHEN`; cambiar estado no afecta Bar Dashboard
- [ ] **Bar Dashboard** muestra solo ítems `BAR`; cambiar estado no afecta Kitchen KDS
- [ ] **Waiter terminal** muestra 1 sola tarjeta por mesa (sub-pedidos agrupados)
- [ ] Validar desde waiter activa todos los sub-pedidos PENDING del `table_id` en batch
- [ ] Entregar desde waiter activa todos los sub-pedidos READY del `table_id` en batch
- [ ] Pedidos con `station IS NULL` (legacy) muestran solo sus ítems de estación en cada KDS

### Auth
- [ ] Usuario con rol `BAR` puede iniciar sesión en Bar Dashboard (puerto 3006)
- [ ] Proxy de Bar Dashboard rechaza roles distintos de `BAR`
- [ ] Auth callback funciona en frío (sin variables de entorno duplicadas)

### Retrocompatibilidad
- [ ] Pedidos legacy (`station IS NULL`) siguen apareciendo en ambos KDS con filtrado por ítem
- [ ] `updateOrderStatus` sin parámetro de estación funciona correctamente para todos los roles

---

## 7. Pasos para el Merge

1. Ejecutar migración `0009` en staging: `psql -f supabase/migrations/0009_order_station_split.sql`
2. Verificar build: `cd Producto && npm run build`
3. Levantar entorno completo: `npm run dev`
4. Probar flujo end-to-end: pedido mixto → validación garzón → KDS cocina → KDS barra → entrega
5. Aprobar PR y hacer merge con `--no-ff` para preservar el historial de la feature branch

---

## 8. Commits Incluidos

| Hash | Descripción |
|---|---|
| `cbd6c84` | refactor(ux-ui): rediseño visual v2.3.0 y corrección de bugs en menú y portal |
| `2c728c8` | feat(portal): optimización Pro Max de navegación y flujo de pedido |
| `e45351f` | docs: actualización de documentación técnica y reportes de gestión v2.3.0 |
| `6a5db07` | docs: remoción de propuesta de PR del repositorio |
| `5cfc1a8` | inicio configuración página bar |
| `0a45ddf` | merge: integración UI/UX refactor v2.3.0 en bar station |
| `bb7f38f` | refactor: estandarización bar dashboard con PremiumHeader y estilos Pro Max |
| `6e87acc` | feat: estabilización del rol BAR en dashboards y APIs |
| `40dd5cd` | feat(bar-kds): integración completa del dashboard de barra |
| `9d7000b` | feat: sistema de entrega parcial, correcciones de autenticación y calidad de código |
| `aabb367` | refactor: separación de pedidos por estación y correcciones de autenticación |
| `9869032` | fix: separación correcta de pedidos por estación en terminal del garzón y KDS |
| `96b98dc` | docs: actualización completa de documentación — arquitectura v2.5.0 |
| `d38da64` | fix: correcciones de estabilidad en KDS, Bar Dashboard y migraciones SQL |

---

*Menu Bites · Equipo de Desarrollo · 2026*
