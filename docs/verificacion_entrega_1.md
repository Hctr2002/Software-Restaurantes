# Reporte de Verificación: Menú Bytes (Entrega 1)

Se ha realizado una auditoría completa del código fuente en relación con los requerimientos establecidos en el documento `Entrega 1.pdf`. A continuación, se detalla el estado actual del proyecto, resaltando los hitos alcanzados y las brechas existentes.

## Análisis de Arquitectura y Tecnologías
La arquitectura base cumple con los lineamientos del documento:
- **Monorepo**: Implementado correctamente con Turborepo, separando lógica en `apps` y `packages`.
- **Aislamiento Multi-Tenant (RLS)**: **✅ Cumplido**. Se verificó en `supabase/migrations/0001_initial_security.sql`. Las políticas de PostgreSQL utilizan la función `get_auth_restaurant_id()` para aislar datos.
- **Stack Tecnológico**: **✅ Cumplido**. Se utiliza Next.js para la web, React Native (Expo) para móvil, y Supabase (PostgreSQL, Auth, Realtime). Cabe destacar que el equipo optó por dividir la capa web en 3 aplicaciones distintas (`admin-dashboard`, `kitchen-kds`, `waiter-terminal`) en lugar de una sola aplicación monolítica, lo cual es una excelente práctica arquitectónica.

## Estado de los Requerimientos Funcionales (RF)

| ID | Requerimiento | Estado Actual | Observaciones |
|---|---|---|---|
| **RF-01** | Autenticación y Roles | **✅ Implementado** | Login con Supabase Auth configurado. La sincronización de usuarios y el campo `app_metadata` con el `restaurant_id` se realiza mediante el trigger `handle_auth_user_sync` en BD. |
| **RF-02** | Panel Super Admin | **✅ Implementado** | El `admin-dashboard` cuenta con rutas para gestionar restaurantes (`/dashboard/restaurants`) y usuarios (`/dashboard/users`). |
| **RF-03** | Menú QR/NFC (Cliente) | **⚠️ Parcial** | La interfaz móvil existe (`apps/mobile/app/(tabs)/index.tsx`), pero utiliza **datos en duro (hardcoded)** para las categorías y productos, en lugar de consumir la base de datos a través del hook `useMenu`. |
| **RF-04** | Gestión de Pedidos (Realtime) | **✅ Implementado** | Se verificó el uso de `Supabase Realtime` (`channel("kitchen_order_changes")`) en `packages/auth/src/hooks.ts` y transiciones validadas mediante triggers SQL (`validate_order_transition`). |
| **RF-05** | Panel de Cocina (Kanban) | **✅ Implementado** | La aplicación `kitchen-kds` posee la vista Kanban (Nuevos, En Preparación, Listos) y emite notificaciones sonoras. |
| **RF-06** | Administración de Tenant | **❌ Pendiente** | Falta la interfaz para que el administrador del restaurante (Tenant) gestione su propio Menú (Categorías, Ítems, Extras) y las Mesas. El esquema de BD (`Category`, `MenuItem`, etc.) existe, pero falta el UI. |
| **RF-07** | Notificaciones Push (Móvil) | **❌ Pendiente** | No se detectó integración con Expo Push Tokens ni funciones para notificar al garzón o cliente. |
| **RF-08** | Solicitud de Cuenta | **❌ Pendiente** | La base de datos soporta los campos `helpRequested` y `billRequested` en la tabla `Table`, pero no existe lógica ni UI en la app móvil para accionarlo. |
| **RF-09** | Bloqueo por Suscripción (HTTP 402) | **❌ Pendiente** | El modelo `Restaurant` cuenta con el `status` (`SubscriptionStatus`), pero no hay middleware en Next.js ni políticas RLS que fuercen el bloqueo (HTTP 402) cuando el tenant está suspendido. |
| **RF-10** | Generación de Código QR | **❌ Pendiente** | Falta la funcionalidad para generar y descargar visualmente los códigos QR desde el panel administrativo, aunque el campo `qr_data` existe en BD. |

## Próximos Pasos Recomendados
Para continuar con el desarrollo, se sugiere priorizar los siguientes requerimientos:
1. **RF-03**: Conectar la vista móvil del menú a la base de datos (eliminar hardcodeo).
2. **RF-06**: Construir las vistas de gestión de menú para los administradores de restaurantes (Tenant).
3. **RF-09**: Implementar el middleware global de bloqueo de suscripciones (HTTP 402).
