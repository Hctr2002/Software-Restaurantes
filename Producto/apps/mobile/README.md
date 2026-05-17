# mobile — App Nativa Menu Bites (React Native / Expo)

App nativa multi-rol para iOS y Android. Concentra en una sola app los dashboards de todos los roles del sistema: cliente, garzón, cocina, barra, caja, admin y super-admin.

## Stack

| Componente | Versión |
|---|---|
| Expo SDK | 54.0.0 |
| React Native | 0.81.5 |
| Expo Router | 6.0.0 (file-based routing) |
| TypeScript | 5.9.2 |
| Backend | Supabase (Auth + Realtime + Storage) |
| Tokens | Expo SecureStore (encriptado nativo) |

## Roles soportados

| Rol | Dashboard | Pantallas |
|---|---|---|
| `CLIENTE` | Menú interactivo QR | 1 pantalla dinámica |
| `GARZON` | Terminal de mesas y pedidos | Dashboard + pedidos |
| `COCINA` | KDS Cocina | 3 tabs (Nuevos / Cocinando / Listos) |
| `BAR` | KDS Barra | 3 tabs (Nuevos / Cocinando / Listos) |
| `CAJERO` | Caja y cobro | 2 tabs (Pendientes / Historial) |
| `ADMIN` | Panel del restaurante | 11 pantallas |
| `SUPER_ADMIN` | Panel global SaaS | 6 pantallas |

## Comandos

```bash
# Desde Producto/apps/mobile/
npx expo start

# Con limpieza de caché
npx expo start --clear

# Para dispositivo Android físico
npx expo start --tunnel
```

## Autenticación

El login requiere credenciales de Supabase. El rol del usuario está en `session.user.app_metadata.role`. Al autenticarse, la app redirige automáticamente al dashboard correspondiente al rol.

La sesión se persiste en **Expo SecureStore** (no en AsyncStorage) para seguridad nativa.

Recuperación de contraseña via deep link: `menubites://reset-password#access_token=...`

## Variables de entorno

Crear `.env` en `apps/mobile/` con:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_SUPERADMIN_API_URL=http://localhost:3000
EXPO_PUBLIC_LOCALADMIN_API_URL=http://localhost:3003
EXPO_PUBLIC_CUSTOMER_PORTAL_API_URL=http://localhost:3005
```

En desarrollo, las URLs de API se auto-detectan (10.0.2.2 para Android emulador, localhost para iOS).

## Funcionalidades nativas exclusivas

* **Escáner QR** (`scanner/`) — apunta a la mesa del cliente
* **Push Notifications** — alertas de órdenes para staff, estado para cliente
* **Audio KDS** — sonido al recibir orden nueva, alerta urgente al superar umbral
* **Haptics** — feedback táctil en acciones críticas
* **Impresión de recibos** — desde el módulo Cajero
* **Upload de imágenes** — selección de foto para ítems del menú (Admin)

## Estructura de carpetas

```text
app/
  (admin)/          # 11 pantallas de gestión: dashboard, mesas, menú,
                    # inventario, categorías, usuarios, reportes, branding, etc.
  (auth)/           # login, forgot-password, reset-password
  (bar)/            # KDS para estación barra (filtrado por station:'BAR')
  (cashier)/        # Dashboard caja y procesamiento de cobros
  (kitchen)/        # KDS cocina con alertas de audio y auto-clear
  (super-admin)/    # 6 pantallas: organizaciones, usuarios, planes
  (tabs)/           # Landing pública (antes del login)
  (waiter)/         # Dashboard garzón: grid mesas + pedidos + merge mode
  [restaurantSlug]/
    [tableNumber]/  # Menú interactivo del cliente accedido via QR
  scanner/          # Escáner de códigos QR
  _layout.tsx       # Layout raíz con AuthContext y ThemeContext
  index.tsx         # Redirect automático según rol

components/         # 20 componentes reutilizables:
                    # OrderDetailModal, MenuItemModal, TableModal,
                    # UserModal, KitchenOrderCard, CashierOrderCard,
                    # AdminSideMenu, AdminKpiCard, RatingModal, etc.

context/
  AuthContext.tsx   # Sesión, rol, restaurantId, push token, deep link
  ThemeContext.tsx  # Branding dinámico por restaurante

lib/
  supabase.ts            # Cliente con ExpoSecureStoreAdapter
  api.ts                 # Descubrimiento dinámico de URLs de API
  pushNotifications.ts   # Registro y gestión de push tokens
  useKdsAudio.ts         # Hook de alertas de audio para KDS

constants/
  MB_Theme.ts       # Paleta institucional (navy/emerald) — fallback de tema
```

## Diferencias clave vs apps web

| Aspecto | Web | Mobile |
|---|---|---|
| Tema dinámico | CSS Variables en `:root` | StyleSheet props directas (React Native) |
| Persistencia sesión | Cookie `sb-*-session` | Expo SecureStore |
| Notificaciones | Web Push API (VAPID) | Expo Notifications |
| Navegación | Next.js App Router | Expo Router (file-based) |
| Paquetes compartidos | `@menu-bites/auth`, `@menu-bites/ui` | No usa — stack nativo independiente |

## Documentación adicional

Para detalles de arquitectura, ver sección **7.15** del [TECHNICAL_SAD.md](../../../../Documentacion/TECHNICAL_SAD.md).
