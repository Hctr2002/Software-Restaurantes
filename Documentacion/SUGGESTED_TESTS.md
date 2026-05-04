# Catálogo de Casos de Prueba — Menu Bites

**Propósito:** Catálogo exhaustivo de casos de prueba individuales con criterios de aceptación precisos. Cada caso está diseñado para ser ejecutable de forma independiente. Para la estrategia QA, pirámide de pruebas y herramientas, ver [TEST_PLAN.md](TEST_PLAN.md).

---

## 1. PRUEBAS UNITARIAS (Vitest / Jest + React Testing Library)

### 1.1 Lógica de Precios e Inventario

**TC-U-001: Cálculo de total de pedido**
- **Función bajo prueba:** `calculateOrderTotal(items: OrderItem[])`
- **Entrada:** `[{ unit_price: 1990, quantity: 2 }, { unit_price: 500, quantity: 1 }]`
- **Resultado esperado:** `4480`
- **Criterio de aceptación:** El resultado debe ser exactamente `sum(unit_price * quantity)` para todos los items.

**TC-U-002: Cálculo de total con extras**
- **Entrada:** Item con `unit_price: 3990, quantity: 1` + extra con `price: 500`
- **Resultado esperado:** `4490`

**TC-U-003: Alerta de stock crítico — umbral exacto**
- **Función:** `isStockCritical(stock: number): boolean`
- **Casos:**
  - `stock = 5` → `true` (umbral incluido)
  - `stock = 6` → `false`
  - `stock = 0` → `true`
  - `stock = -1` → `true` (stock negativo también es crítico)

**TC-U-004: Alerta de stock — cambio de color en UI**
- **Componente:** `StockBadge`
- **Cuando `stock <= 5`:** Badge con clase CSS `bg-red-500`
- **Cuando `stock > 5`:** Badge con clase CSS `bg-green-500`

### 1.2 Formateadores y Utilidades

**TC-U-005: Formateo de moneda CLP**
- **Función:** `formatPrice(amount: number): string`
- **Casos:**
  - `3990` → `"$3.990"`
  - `1000000` → `"$1.000.000"`
  - `0` → `"$0"`
  - `1990.5` → `"$1.991"` (redondeo a entero para CLP)

**TC-U-006: Formateo de fecha para display**
- **Función:** `formatDate(iso: string): string`
- **Entrada:** `"2024-01-15T10:30:00Z"`
- **Resultado esperado:** `"15 ene 2024, 10:30"` (o formato local configurado)

**TC-U-007: Cálculo de tiempo relativo (`timeAgo`)**
- **Casos:**
  - `now - 30s` → `"hace 30 segundos"`
  - `now - 5min` → `"hace 5 minutos"`
  - `now - 2h` → `"hace 2 horas"`

### 1.3 Lógica de Máquina de Estados

**TC-U-008: Transiciones válidas de OrderStatus**
- **Función:** `getNextValidStatuses(current: OrderStatus, role: Role): OrderStatus[]`
- **Casos:**
  - `PENDING` + `GARZON` → `[VALIDATED, REJECTED]`
  - `VALIDATED` + `COCINA` → `[PREPARING]`
  - `PREPARING` + `COCINA` → `[READY]`
  - `READY` + `GARZON` → `[DELIVERED]`
  - `DELIVERED` + cualquier rol → `[]` (estado terminal)

**TC-U-009: Transiciones inválidas**
- `PENDING` + `COCINA` → `[]` (cocina no puede validar)
- `PREPARING` + `GARZON` → `[]` (garzón no puede cambiar durante preparación)

---

## 2. PRUEBAS DE INTEGRACIÓN

### 2.1 Autenticación y RBAC

**TC-I-001: Redirección por rol — GARZON intenta acceder a admin**
- **Precondición:** Usuario con `role = GARZON` autenticado.
- **Acción:** GET `/admin/restaurants`
- **Resultado esperado:** Redirección a `/unauthorized` o HTTP 403.
- **Criterio de aceptación:** El body de la respuesta no contiene datos de restaurantes.

**TC-I-002: Redirección por rol — sin sesión**
- **Acción:** GET `/pizzeria-napoli/dashboard` sin cookie de sesión.
- **Resultado esperado:** Redirección a `/login`.

**TC-I-003: Persistencia de sesión tras recarga**
- **Acción:** Login exitoso → recargar la página.
- **Resultado esperado:** El usuario sigue autenticado con el mismo rol y `restaurant_id`.

**TC-I-004: Slug de URL vs tenant del JWT no coinciden**
- **Precondición:** ADMIN del `restaurant_id = A`.
- **Acción:** GET `/restaurante-b/dashboard`
- **Resultado esperado:** 403 Forbidden o redirect. Nunca mostrar datos del Restaurante B.

### 2.2 Aislamiento Multi-Tenant (RLS)

**TC-I-005: Tenant leakage en orders — ninguna fuga**
- **Setup:** Restaurante A con 5 pedidos. Restaurante B con 3 pedidos.
- **Acción:** `supabase.from("orders").select("*")` con JWT de Restaurante A.
- **Resultado esperado:** Exactamente 5 filas, todas con `restaurant_id = A`.
- **Fallo si:** Se retorna alguna fila con `restaurant_id = B`.

**TC-I-006: Tenant leakage en menu_items — ninguna fuga**
- **Misma lógica aplicada a `menu_items`, `tables`, `inventories`, `order_items`.**

**TC-I-007: Acceso anónimo al menú**
- **Acción:** `supabase.from("menu_items").select("*")` con rol `anon`.
- **Resultado esperado:** Solo items con `is_active = true`. Sin error de RLS.

**TC-I-008: Acceso anónimo NO puede insertar pedidos directamente**
- **Acción:** INSERT directo en `orders` con rol `anon`.
- **Resultado esperado:** Error RLS `42501` (insufficient privilege). Los pedidos solo se crean vía la API Route que usa el SDK con el contexto correcto.

### 2.3 Realtime

**TC-I-009: Nuevo pedido propaga a suscriptores**
- **Setup:** Dos clientes suscritos al canal `orders` del mismo restaurante.
- **Acción:** INSERT en `orders`.
- **Resultado esperado:** Ambos clientes reciben el evento en < 500ms sin refrescar.

**TC-I-010: Cambio de estado propaga a Waiter Terminal**
- **Setup:** Waiter Terminal suscrito a `orders`.
- **Acción:** KDS actualiza `orders.status = READY`.
- **Resultado esperado:** El Waiter Terminal actualiza el indicador de la mesa en tiempo real.

**TC-I-011: Reconexión tras pérdida de red**
- **Acción:** Desconectar red 10s → reconectar.
- **Resultado esperado:** El canal Realtime se reconecta automáticamente y reconcilia el estado.

---

## 3. PRUEBAS E2E (Playwright)

### 3.1 Customer Portal

**TC-E-001: Escaneo QR y carga de menú**
- Navegar a `/?qr={token_valido}`.
- **Verificar:** URL final contiene `restaurant_id` y `table_id`.
- **Verificar:** El menú carga con categorías e items del restaurante correcto.
- **Verificar:** Los colores del tema aplicado coinciden con `restaurant_themes.primary_color`.

**TC-E-002: Agregar item con extra al carrito**
- Seleccionar un producto con extras disponibles.
- Agregar extra opcional.
- **Verificar:** El total del carrito = `unit_price + extra.price`.
- **Verificar:** La nota del item se guarda en el carrito.

**TC-E-003: Confirmar pedido y verificar estado inicial**
- Confirmar carrito → POST a `/api/customer/orders`.
- **Verificar:** El pedido aparece en el seguimiento con estado "Recibido".
- **Verificar:** En Local Dashboard aparece como `PENDING` con los items correctos.

**TC-E-004: Solicitar asistencia**
- Presionar "Pedir asistencia".
- **Verificar:** `tables.help_requested = true` en DB.
- **Verificar:** Alerta visible en Waiter Terminal sin recargar.

**TC-E-005: Solicitar la cuenta**
- Presionar "Pedir la cuenta".
- **Verificar:** `tables.bill_requested = true`.
- **Verificar:** Mesa aparece en cola del Cashier Dashboard.

### 3.2 Flujo Operativo Completo

**TC-E-006: Ciclo completo PENDING → DELIVERED**
1. Customer Portal: crear pedido con 2 items.
2. Waiter Terminal: validar pedido → `VALIDATED`.
3. Kitchen KDS: iniciar preparación → `PREPARING`.
4. Kitchen KDS: marcar como listo → `READY`.
5. Waiter Terminal: entregar → `DELIVERED`.
- **Verificar en cada paso:** Estado propagado por Realtime a todas las apps abiertas.
- **Verificar al final:** `table.status` sigue en `OCCUPIED` (la mesa no se libera hasta cobro).

**TC-E-007: Cierre de mesa por Cajero**
1. Tener una mesa con pedido `DELIVERED` y `bill_requested = true`.
2. Cajero abre cuenta → verifica total con snapshot de precios.
3. Selecciona "Tarjeta" y confirma cobro.
- **Verificar:** `order.status = DELIVERED`, `table.status = FREE`, `bill_requested = false`.
- **Verificar:** La mesa desaparece de la cola del Cashier.

### 3.3 Branding

**TC-E-008: Cambio de tema propaga al Customer Portal**
1. ADMIN activa un nuevo tema en Branding Lab.
2. Customer Portal ya está abierto en otra pestaña.
- **Verificar:** El color primario cambia en el Customer Portal sin recargar.

---

## 4. PRUEBAS DE SEGURIDAD

**TC-S-001: Intento de acceso cross-tenant via URL**
- **Acción:** ADMIN de Restaurante A navega manualmente a `/restaurante-b/dashboard`.
- **Resultado esperado:** 403 o redirect. Cero datos de Restaurante B visibles.

**TC-S-002: Intento de inyección en campo de nombre de producto**
- **Acción:** Crear `menu_item` con `name = "<script>alert('xss')</script>"`.
- **Resultado esperado:** El nombre se muestra como texto plano en el Customer Portal, sin ejecutar el script.

**TC-S-003: Intento de manipulación del total en POST de pedido**
- **Acción:** POST a `/api/customer/orders` con `total_amount` manipulado en el body.
- **Resultado esperado:** El backend ignora el `total_amount` del body y lo recalcula desde los precios del menú en DB. El pedido se guarda con el total correcto.

**TC-S-004: Acceso a ruta de SUPER_ADMIN con rol ADMIN**
- **Acción:** GET `/api/admin/restaurants` con JWT de un ADMIN de restaurante.
- **Resultado esperado:** HTTP 403. Sin datos en la respuesta.

**TC-S-005: QR de otra mesa redirige correctamente**
- **Acción:** Usar el `qr_data` de la Mesa 3 para intentar pedir en Mesa 5 del mismo restaurante.
- **Resultado esperado:** El sistema asocia el pedido a la Mesa 3, no a la 5. El `qr_data` es la fuente de verdad.

---

## 5. PRUEBAS DE REPORTES

**TC-R-001: Consistencia del total de ventas**
- Crear manualmente 5 pedidos con valores conocidos.
- Verificar que `GET /api/local/reports/sales` retorna exactamente la suma correcta.
- **Criterio:** Precisión al centavo (2 decimales).

**TC-R-002: Exportación Excel legible**
- Generar reporte y descargar `.xlsx`.
- Abrir con LibreOffice o Excel.
- **Verificar:** Columnas de precio usan formato moneda CLP. Fechas en formato legible. Sin celdas vacías en filas de datos.

**TC-R-003: Filtrado por rango de fechas UTC**
- Crear pedidos en dos fechas distintas.
- Filtrar por `from` y `to` que incluyen solo una fecha.
- **Verificar:** Solo aparecen los pedidos dentro del rango. Sin pedidos de la fecha excluida.

**TC-R-004: Ranking de top productos**
- Crear 10 pedidos: producto A aparece 8 veces, producto B 3 veces.
- Verificar que el reporte de top items retorna A en posición 1 y B en posición 2.

---

## 9. TESTS SUGERIDOS — NUEVAS FUNCIONALIDADES v2.0

### 9.1 Tests de Utilidades Compartidas (`@menu-bites/auth`)

```typescript
// packages/auth/src/utils.test.ts

describe("formatCLP", () => {
  it("formatea miles correctamente en es-CL", () => {
    expect(formatCLP(36000)).toBe("$36.000");
    expect(formatCLP(1500)).toBe("$1.500");
    expect(formatCLP(0)).toBe("$0");
  });
});

describe("timeAgo", () => {
  it("retorna 'Ahora' para menos de 1 minuto", () => {
    expect(timeAgo(new Date().toISOString())).toBe("Ahora");
  });
  it("retorna minutos para < 60 min", () => {
    const ago = new Date(Date.now() - 5 * 60000).toISOString();
    expect(timeAgo(ago)).toBe("5 min");
  });
  it("retorna horas para >= 60 min", () => {
    const ago = new Date(Date.now() - 90 * 60000).toISOString();
    expect(timeAgo(ago)).toBe("1h");
  });
});

describe("diffMinutes", () => {
  it("retorna null si algún argumento es nulo", () => {
    expect(diffMinutes(null, "2026-01-01T00:00:00Z")).toBeNull();
    expect(diffMinutes("2026-01-01T00:00:00Z", null)).toBeNull();
  });
  it("calcula diferencia positiva en minutos", () => {
    const a = "2026-01-01T10:00:00Z";
    const b = "2026-01-01T10:15:00Z";
    expect(diffMinutes(a, b)).toBe(15);
  });
});

describe("constants", () => {
  it("LOW_STOCK_THRESHOLD es 5", () => {
    expect(LOW_STOCK_THRESHOLD).toBe(5);
  });
  it("ORDER_STATUS_LABEL contiene todos los estados", () => {
    const required = ["PENDING", "VALIDATED", "PREPARING", "READY", "DELIVERED", "REJECTED"];
    required.forEach(s => expect(ORDER_STATUS_LABEL[s]).toBeDefined());
  });
});
```

### 9.2 Tests de API — Customer Portal

**TC-API-REVIEW-001: POST /api/reviews — rating válido**
```
POST /api/reviews
Body: { order_id: "uuid", restaurant_id: "uuid", table_id: "uuid", rating: 5 }
→ 200 { ok: true }
→ Verificar: registro insertado en tabla reviews con rating=5
```

**TC-API-REVIEW-002: POST /api/reviews — rating fuera de rango**
```
POST /api/reviews
Body: { order_id: "uuid", restaurant_id: "uuid", rating: 6 }
→ 400 { error: "Datos inválidos" }
```

**TC-API-BILL-001: POST /api/bill-request — mesa válida**
```
POST /api/bill-request
Body: { table_id: "uuid-valido" }
→ 200 { ok: true }
→ Verificar: tables.bill_requested = true vía Realtime en Waiter y Cashier
```

**TC-API-BILL-002: POST /api/bill-request — sin table_id**
```
POST /api/bill-request
Body: {}
→ 400 { error: "table_id es obligatorio" }
```

### 9.3 Tests de API — Kitchen KDS

**TC-API-INV-001: GET /api/inventory — exportar CSV**
```
GET /api/inventory (con cookie sb-kds-session válida)
→ 200 Content-Type: text/csv
→ Primera línea: "id,nombre,stock_actual,unidad"
→ Filas con datos reales del restaurante autenticado
```

**TC-API-INV-002: POST /api/inventory — importar CSV válido**
```
POST /api/inventory
Body (text/plain):
  id,nombre,stock_actual,unidad
  uuid-1,Tomates,3.00,kg

→ 200 { updated: 1, errors: [], critical: [{name:"Tomates", stock:3, unit:"kg"}] }
→ Verificar: inventories.stock = 3 donde id = uuid-1
→ Verificar: nombre y unidad NO cambiaron
```

**TC-API-INV-003: POST /api/inventory — id inválido en CSV**
```
POST /api/inventory
Body: CSV con id="00000000-0000-0000-0000-000000000000" (no existe)
→ 200 { updated: 0, errors: [] }   -- fila ignorada silenciosamente
```

### 9.4 Tests de API — Waiter Terminal

**TC-API-SESSION-001: POST /api/sessions — fusión exitosa**
```
POST /api/sessions
Body: { tableIds: ["uuid-a", "uuid-b"] }
→ 200 { sessionId: "uuid-nuevo", ordersUpdated: N }
→ Verificar: órdenes activas de ambas mesas tienen session_id = uuid-nuevo
```

**TC-API-SESSION-002: POST /api/sessions — solo 1 mesa**
```
POST /api/sessions
Body: { tableIds: ["uuid-a"] }
→ 400 { error: "Se necesitan al menos 2 mesas" }
```

**TC-API-SESSION-003: DELETE /api/sessions — separar mesas**
```
DELETE /api/sessions
Body: { sessionId: "uuid-existente" }
→ 200 { ok: true }
→ Verificar: orders.session_id = null para las órdenes afectadas
```

### 9.5 Tests de Integración — Flujo de Órdenes Completo

**TC-INT-FLOW-001: Ciclo completo sin fusión**
1. `POST /api/orders` → orden PENDING, mesa OCCUPIED
2. `PUT /api/local/orders/{id}` status=VALIDATED → orden VALIDATED, validated_at set
3. `PUT /api/local/orders/{id}` status=PREPARING → preparing_at set
4. `PUT /api/local/orders/{id}` status=READY → ready_at set
5. Cashier: `PATCH orders` status=DELIVERED, `PATCH tables` status=CLEANING
6. Waiter: `PATCH tables` status=FREE
→ Verificar cada transición via `GET /api/local/orders/{id}`

**TC-INT-FLOW-002: Rechazo con liberación de mesa**
1. `POST /api/orders` → mesa OCCUPIED (única orden activa)
2. Waiter rechaza → orden REJECTED
3. → Verificar: `tables.status = FREE` automáticamente

### 9.6 Tests de Componentes — Customer Portal

**TC-COMP-TRACKER-001: OrderTracker muestra paso correcto**
```tsx
render(<OrderTracker status="PREPARING" />)
expect(screen.getByText("En preparación")).toBeInTheDocument()
// Solicitado y Confirmado aparecen con opacity-60 (done)
// Listo aparece con opacity-20 (pending)
```

**TC-COMP-RATING-001: RatingModal envía correctamente**
```tsx
const onSubmit = jest.fn()
render(<RatingModal stars={4} onSubmit={onSubmit} ... />)
fireEvent.click(screen.getByText("Enviar"))
expect(onSubmit).toHaveBeenCalledTimes(1)
```

**TC-COMP-MENUITEM-001: MenuItemCard muestra contador si está en carrito**
```tsx
render(<MenuItemCard item={mockItem} cartQuantity={2} ... />)
expect(screen.getByText("2")).toBeInTheDocument()
// Botones + y - visibles en vez de "Añadir"
```
