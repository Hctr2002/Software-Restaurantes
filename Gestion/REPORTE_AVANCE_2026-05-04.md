# Reporte de Avance — Desarrollo de Software de Restaurantes

## 1. Identificación del Reporte

- **Fecha del Reporte:** 2026-05-04
- **Desarrollador Responsable:** Equipo Técnico
- **Semana/Hito a Reportar:** S7 — Implementación del Plan Maestro Completo (Waves 1–6) y Auditoría Clean Code
- **Estado Propuesto:** Done

---

## 2. Resumen Ejecutivo

Esta sesión implementó el ciclo de vida completo del sistema de restaurante, desde el flujo de órdenes hasta la infraestructura de notificaciones push, pasando por analytics de cocina, fusión de mesas, comprobantes digitales y una auditoría de calidad de código. El sistema quedó en estado de producción con TypeScript compilando sin errores en todas las aplicaciones del monorepo.

---

## 3. Detalle Técnico por Área

### 3.1 Flujo Completo de Órdenes

Se implementó y validó el ciclo `PENDING → VALIDATED → PREPARING → READY → DELIVERED` con participación coordinada de los cuatro roles del sistema:

| Actor | Acción | Estado resultante |
|---|---|---|
| Cliente (Customer Portal) | Confirma pedido | `PENDING` + mesa → `OCCUPIED` |
| Garzón (Waiter Terminal) | Valida pedido | `VALIDATED` |
| Garzón (Waiter Terminal) | Rechaza pedido | `REJECTED` + mesa → `FREE` si no hay más pedidos activos |
| Cocina (Kitchen KDS) | Inicia preparación | `PREPARING` |
| Cocina (Kitchen KDS) | Marca listo | `READY` |
| Cajero (Cashier Dashboard) | Procesa pago | `DELIVERED` + mesa → `CLEANING` |
| Garzón (Waiter Terminal) | Confirma limpieza | mesa → `FREE` |

**Cambios de esquema requeridos (ejecutados en Supabase):**

- `ALTER TYPE "TableStatus" ADD VALUE 'CLEANING'`
- `ALTER TABLE orders ADD COLUMN validated_at TIMESTAMPTZ`
- `ALTER TABLE orders ADD COLUMN preparing_at TIMESTAMPTZ`
- `ALTER TABLE orders ADD COLUMN ready_at TIMESTAMPTZ`
- `ALTER TABLE orders ADD COLUMN session_id UUID`
- `CREATE TABLE push_subscriptions (...)` con políticas RLS
- `CREATE TABLE reviews (...)` con políticas RLS

### 3.2 Sistema de Inventario KDS ↔ Admin

- API `GET /api/inventory` en kitchen-kds: exporta la tabla `inventories` del restaurante como CSV descargable (columnas: `id, nombre, stock_actual, unidad`).
- API `POST /api/inventory` en kitchen-kds: recibe CSV de texto, parsea y actualiza únicamente el campo `stock` por `id`. Retorna ítems críticos post-upload.
- Nuevo tab "Inventario" en `SettingsModal.tsx` del KDS con instrucciones paso a paso, botón de descarga y botón de subida.
- Local Dashboard: sección de stock crítico segmentada en "Agotados" (stock = 0) y "Stock Bajo" (0 < stock ≤ 5), más botón "Exportar CSV" client-side.

### 3.3 Wave 1 — Fundación de Schema

- `packages/auth/src/index.ts`: la función `updateOrderStatus()` ahora escribe automáticamente `validated_at`, `preparing_at` o `ready_at` según el estado de destino. No requiere cambios en los llamadores existentes.
- `supabase/prisma/schema.prisma`: actualizado para reflejar todos los cambios de columnas y el nuevo valor del enum.

### 3.4 Wave 2 — Excelencia Operativa

- **Sonido ORDER_READY en Waiter Terminal**: alerta de audio cuando la lista de órdenes READY crece, usando `useRef` para comparar con el conteo previo.
- **Tracker de pedido en Customer Portal**: barra de 4 pasos (`Solicitado → Confirmado → En preparación → Listo`) vinculada a Realtime de Supabase sobre `orders.id`. Aparece tras confirmar un pedido y desaparece al llegar a `DELIVERED`.
- **Vista "Mi Cuenta" en Customer Portal**: botón flotante que abre un bottom sheet con todos los pedidos activos de la mesa y el total acumulado. Suscripción Realtime por `table_id`.
- **Estado CLEANING**: el cashier ya no libera la mesa directamente a `FREE`. La mesa pasa a `CLEANING` y el garzón la confirma como lista desde su terminal.
- **Notas de cocina**: campo de texto en cada card de pedido pendiente del Waiter Terminal. Guarda en `orders.notes` antes de validar.

### 3.5 Wave 3 — Cashier & Comprobante Digital

- **Vista consolidada por mesa**: las órdenes READY se agrupan por `session_id` (si existen mesas fusionadas) o por `table_id`. Cada grupo = una tarjeta cobrable con el total acumulado de todas las comandas.
- **Comprobante digital imprimible**:
  - `/receipt/table/[tableId]` para mesas normales.
  - `/receipt/session/[sessionId]` para mesas fusionadas (desglose por mesa dentro de la sesión).
  - Ambas páginas son Server Components con service role, accesibles sin autenticación del cashier.
  - CSS `@media print` oculta botones de acción.

### 3.6 Wave 4 — Analytics & Inteligencia de Cocina

- **Heatmap de tiempos**: nueva sección en `reports/page.tsx` que agrupa por categoría de plato y calcula promedios de: tiempo de validación (`validated_at - created_at`), tiempo de cocina (`ready_at - validated_at`) y ciclo total. Visualizado con barras CSS con código de color verde/amarillo/rojo.
- **Dashboard overview en vivo**: nuevo widget "Flujo en Vivo" con contadores por estado (Pendiente, Validado, Preparando, Listo) y widget "Tiempo Promedio Hoy" con indicador Óptimo/Normal/Lento.
- **Escalación de alertas**: banner rojo con `AnimatePresence` que aparece cuando alguna orden lleva más de 3 minutos en `PENDING`. Se recalcula cada 30 segundos sin llamadas extra al servidor.
- **Grilla de mesas actualizada**: color azul cielo para `CLEANING` junto a los colores existentes.

### 3.7 Wave 5 — Features Avanzados

**Web Push para ORDER_READY:**
- Service Worker en `apps/waiter-terminal/public/sw.js` registrado en el layout.
- Endpoint `POST /api/push/subscribe` guarda suscripción VAPID en tabla `push_subscriptions`.
- Endpoint `POST /api/push/notify` envía push a todos los garzones del restaurante usando `web-push`.
- Claves VAPID configuradas en `.env` raíz del proyecto.
- Degradación silenciosa si el browser no soporta push o el usuario rechaza el permiso.

**Fusión de Mesas:**
- Botón 🔗 en el mapa de mesas del Waiter Terminal activa modo selección múltiple.
- Solo mesas `OCCUPIED` son seleccionables; las seleccionadas muestran checkmark azul.
- Al confirmar: `POST /api/sessions` genera un UUID como `session_id` y lo asigna a todas las órdenes activas de las mesas seleccionadas.
- El Cashier Dashboard agrupa las órdenes por `session_id` y muestra un comprobante unificado.
- `DELETE /api/sessions` limpia el `session_id` para separar mesas.

**Rating Post-Pago:**
- Cuando una orden pasa a `DELIVERED` (detectado via Realtime), aparece un modal de 5 estrellas con comentario opcional 1.5s después.
- `POST /api/reviews` inserta en tabla `reviews` con `order_id`, `restaurant_id`, `table_id`, `rating`, `comment`.
- Botón "Omitir" disponible. El modal desaparece automáticamente tras enviar.

### 3.8 Wave 6 — Resiliencia & Polish

**KDS Offline (Service Worker):**
- `apps/kitchen-kds/public/sw.js` con estrategia Cache-First para `_next/static/` y Network-First con fallback para páginas.
- Registrado desde `layout.tsx` vía `window.load`.
- En modo offline: sirve la última carga cacheada; al reconectar se sincroniza automáticamente.

**Micro-animaciones KDS:**
- `TicketWrapper` convertido a `motion.div` con spring physics (`stiffness: 340, damping: 26`).
- Entrada: `y: -16 → 0, scale: 0.96 → 1`. Salida: `scale: 0.92, opacity: 0`.
- Contadores de columna con `AnimatePresence` para animación numérica al cambiar valor.

**Fine Dining UI Customer Portal:**
- Cards del menú con animación staggered al cambiar categoría (framer-motion).
- Contador inline +/- por ítem cuando ya está en el carrito, sin abrir el bottom sheet.
- Zoom suave en imágenes y gradiente overlay para legibilidad del precio.

### 3.9 Clean Code — Auditoría y Refactoring

**Utilidades compartidas centralizadas:**

Nuevo archivo `packages/auth/src/utils.ts` exportado desde `@menu-bites/auth`:

| Función | Antes | Después |
|---|---|---|
| `formatCLP()` | 3 definiciones locales | 1 exportación compartida |
| `timeAgo()` | 2 definiciones locales | 1 exportación compartida |
| `formatDateTime()` | 2 definiciones locales | 1 exportación compartida |
| `orderItemTotal()` | inline en múltiples sitios | 1 exportación compartida |
| `diffMinutes()` | 1 definición aislada | 1 exportación compartida |

Nuevo archivo `packages/auth/src/constants.ts`:

| Constante | Antes | Después |
|---|---|---|
| `LOW_STOCK_THRESHOLD = 5` | 2 definiciones | 1 exportación compartida |
| `CRITICAL_STOCK_THRESHOLD = 5` | 1 definición aislada | Unificada con LOW_STOCK |
| `STALE_ORDER_MINUTES = 3` | 1 definición local | 1 exportación compartida |
| `ORDER_STATUS_LABEL` | disperso por apps | 1 mapa centralizado |

**Componentes extraídos (god component → componentes autónomos):**

| App | Componentes creados |
|---|---|
| `cashier-dashboard` | `AlertModal.tsx`, `OrderGroupCard.tsx`, `PaymentSlideOver.tsx` |
| `waiter-terminal` | `PendingOrderCard.tsx`, `ReadyOrdersBanner.tsx`, `TableMergeBar.tsx` |
| `customer-portal` | `OrderTracker.tsx`, `RatingModal.tsx`, `CuentaSheet.tsx`, `MenuItemCard.tsx` |

**Resultado:**

| Archivo | Líneas antes | Líneas después | Reducción |
|---|---|---|---|
| `cashier-dashboard/page.tsx` | 905 | 638 | −30% |
| `customer-portal/page.tsx` | 857 | 656 | −23% |

---

## 4. Artefactos y Trazabilidad

- **Rama activa:** `feature/front_kds`
- **Aplicaciones modificadas:** cashier-dashboard, waiter-terminal, customer-portal, kitchen-kds, local-dashboard
- **Paquetes modificados:** `@menu-bites/auth` (utils.ts, constants.ts, index.ts)
- **Nuevos archivos API:**
  - `customer-portal/src/app/api/reviews/route.ts`
  - `customer-portal/src/app/api/bill-request/route.ts`
  - `waiter-terminal/src/app/api/sessions/route.ts`
  - `waiter-terminal/src/app/api/push/subscribe/route.ts`
  - `waiter-terminal/src/app/api/push/notify/route.ts`
  - `kitchen-kds/src/app/api/inventory/route.ts`
- **Service Workers:** `apps/waiter-terminal/public/sw.js`, `apps/kitchen-kds/public/sw.js`
- **Documentación actualizada:** `USER_MANUAL.md`, `DATABASE_SCHEMA.md`, `DATABASE_TECHNICAL.md`

---

## 5. Estado de Validación (QA)

- **TypeScript:** `npx tsc --noEmit` sin errores en las 5 apps afectadas.
- **Sin regresiones de imports:** verificado con `grep` que `formatCLP`, `timeAgo` y `LOW_STOCK_THRESHOLD` ya no se definen localmente en ningún archivo de apps (solo en el paquete compartido).
- **VAPID:** Claves generadas y configuradas en `.env`. Endpoint `/api/push/notify` validado contra `web-push`.
- **Schema Supabase:** Queries de verificación ejecutadas y confirmadas por el usuario.

---

## 6. Bloqueos y Deuda Técnica

- **HTTPS obligatorio para Web Push**: En desarrollo local las notificaciones push solo funcionan cuando el tab está abierto (Realtime las cubre). El Service Worker completo requiere HTTPS, disponible en el entorno de producción (Vercel).
- **Fusión de mesas**: El `session_id` se asigna a órdenes existentes. Órdenes futuras desde el Customer Portal no heredan automáticamente el `session_id` — el garzón debe fusionar manualmente después de cada nueva ronda. Mejora pendiente para v2.
- **Heatmap analytics**: Solo disponible para órdenes creadas después de la migración del Wave 1 (órdenes anteriores no tienen `validated_at`/`ready_at`).

---

## 7. Siguientes Pasos

1. Merge de `feature/front_kds` a `develop` con revisión de regresiones visuales.
2. Auditoría de accesibilidad (WCAG 2.1) en interfaces de Customer Portal y Waiter Terminal.
3. Pruebas de estrés en el módulo de cocina bajo alta concurrencia de órdenes.
4. Configurar HTTPS en entorno de staging para prueba end-to-end de Web Push.
5. Preparación de entorno de demostración final del producto.
