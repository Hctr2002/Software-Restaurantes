# customer-portal — Portal del Cliente

Aplicación Next.js 16 (App Router) de acceso público. El cliente escanea el código QR de su mesa y accede al menú digital del restaurante para hacer pedidos, seguirlos en tiempo real y solicitar la cuenta.

## Puerto de desarrollo

```text
http://localhost:3005
```

## Acceso

Público (sin autenticación requerida). La URL tiene el formato:

```text
/{restaurantSlug}/{tableNumber}
```

Ejemplo: `/mi-restaurante/4`

## Responsabilidades

* Mostrar el menú filtrado por restaurante (multitenant via slug)
* Gestionar el carrito y confirmar pedidos
* Seguimiento en tiempo real del estado del pedido (PENDING → READY)
* Solicitud de cuenta y asistencia del garzón
* Valoración del servicio tras la entrega

## Arquitectura especial

* **Sin autenticación:** usa el rol `anon` de Supabase con políticas RLS públicas.
* **Tema dinámico:** `RestaurantThemeProvider` inyecta los colores y tipografías del restaurante en `:root` al cargar.
* **Anti-FOUC:** script bloqueante en `<head>` aplica el tema cacheado en localStorage antes del primer paint.
* **Creación de pedidos server-side:** `/api/orders` usa la `SUPABASE_SERVICE_ROLE_KEY` para bypasear RLS — el cliente anónimo no puede insertar directamente.

## Comandos

Ejecutar desde la raíz del monorepo (`Producto/`):

```bash
turbo dev --filter=customer-portal
```

## Estructura relevante

```text
src/
  app/
    [restaurantSlug]/
      layout.tsx              # Resuelve el tenant y aplica el tema
      [tableNumber]/
        page.tsx              # Página principal del menú
        _components/          # CheckoutModal, CategoryNav, AccountActions, etc.
    api/
      orders/route.ts         # Crea sub-pedidos KITCHEN y BAR
      bill-request/route.ts
      help-request/route.ts
      reviews/route.ts
  context/
    TenantContext.tsx          # Proveedor del restaurante activo
  lib/
    tenant.ts                 # Queries filtradas por restaurant_id
```

## Dependencias internas

* `@menu-bites/auth` — cliente Supabase, useCustomerPortal, useCustomerOrderTracker, useMenu
* `@menu-bites/ui` — PortalMenuItemCard, PortalPrimaryButton, PortalHeading, PortalText, RestaurantThemeProvider, PremiumHeader, RatingModal, CuentaSheet, OrderTracker
