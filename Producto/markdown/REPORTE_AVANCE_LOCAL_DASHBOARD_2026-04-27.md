# Reporte de Avance - PROJ-menu-bites

---

## 1. Identificacion del Reporte

- **Fecha del Reporte:** 2026-04-27
- **Desarrollador Responsable:** cucholambreta
- **Semana/Hito a Reportar:** Implementacion de Dashboards por Rol - Panel Administrador Local
- **Estado Propuesto para Notion:** In progress

---

## 2. Resumen Tecnico de Ejecucion

- Adicion del rol `CAJERO` al union type `UserIdentity` en el paquete compartido `@menu-bites/store`, extendiendo el modelo de identidad de 5 a 6 roles del sistema.
- Actualizacion del arreglo `ROLES` en `adminShared.ts` del `admin-dashboard` para exponer el nuevo rol en el formulario de creacion y edicion de usuarios.
- Creacion de la aplicacion Next.js `local-dashboard` (puerto 3003) bajo `apps/local-dashboard/`, replicando el UX/UI del `admin-dashboard` (JSM style, dark theme, sidebar fijo, glassmorphism).
- Implementacion de middleware de sesion (`src/middleware.ts`) con default export compatible con Next.js, que protege todas las rutas bajo `/dashboard` y redirige segun estado de autenticacion.
- Implementacion de capa de autorizacion `localApi.ts` con funcion `requireAdmin()` que valida `role === 'ADMIN'` y presencia de `restaurant_id` en `app_metadata` del JWT de Supabase.
- Creacion de pagina de login con validacion de rol en cliente: bloquea el acceso y cierra sesion si el rol no es `ADMIN`.
- Creacion de flujo completo de recuperacion de contrasena (`/forgot-password`, `/reset-password`) identico al del `admin-dashboard`.
- Implementacion del componente `LocalShell` (sidebar + header con breadcrumbs) con navegacion de 4 secciones: Resumen, Gestion (Menu, Mesas, Pedidos) y Cuenta.
- Implementacion de pagina de resumen con 4 KPIs (items del menu, mesas, pedidos del dia, pedidos activos), tabla de ultimos 10 pedidos con badges de estado, y grilla de estado de mesas.
- Implementacion de pagina de gestion de menu con CRUD completo (crear, editar, eliminar items) usando modal slide-over, campos: nombre, descripcion, precio CLP, estado activo.
- Implementacion de pagina de gestion de mesas con CRUD completo, campos: numero, etiqueta, estado (AVAILABLE / OCCUPIED / RESERVED).
- Implementacion de pagina de historial de pedidos (lectura), mostrando mesa, estado, cantidad de items y fecha.
- Implementacion de pagina de configuracion de perfil (actualizacion de nombre y contrasena).
- Implementacion de 6 rutas API REST bajo `/api/local/` protegidas por `requireAdmin()` y con scope estricto por `restaurant_id`: `GET/POST /menu`, `PUT/DELETE /menu/[id]`, `GET/POST /tables`, `PUT/DELETE /tables/[id]`, `GET /orders`, `PUT /profile`.
- Verificacion de compilacion TypeScript sin errores (`tsc --noEmit`).

---

## 3. Artefactos y Codigo (Trazabilidad)

- **Rama Activa:** `feature/front_superadmin`
- **Commit de referencia:** `df3629a` (feat(superadmin): initial setup and ui adjustments)
- **Archivos Clave Afectados:**

  - `packages/store/src/index.ts` - union type UserIdentity extendido
  - `apps/admin-dashboard/src/app/dashboard/_components/adminShared.ts` - array ROLES actualizado
  - `apps/local-dashboard/package.json` - nueva app, puerto 3003
  - `apps/local-dashboard/tsconfig.json` - paths a paquetes compartidos
  - `apps/local-dashboard/next.config.mjs` - transpile de paquetes
  - `apps/local-dashboard/tailwind.config.ts` - preset compartido de UI
  - `apps/local-dashboard/src/middleware.ts` - proteccion de rutas servidor
  - `apps/local-dashboard/src/lib/localApi.ts` - autorizacion por rol y restaurante
  - `apps/local-dashboard/src/app/layout.tsx`
  - `apps/local-dashboard/src/app/page.tsx` - login con validacion de rol ADMIN
  - `apps/local-dashboard/src/app/forgot-password/page.tsx`
  - `apps/local-dashboard/src/app/reset-password/page.tsx`
  - `apps/local-dashboard/src/app/dashboard/_components/LocalShell.tsx`
  - `apps/local-dashboard/src/app/dashboard/_components/{Table,Modal,Badge}.tsx`
  - `apps/local-dashboard/src/app/dashboard/_components/localShared.ts`
  - `apps/local-dashboard/src/app/dashboard/page.tsx`
  - `apps/local-dashboard/src/app/dashboard/menu/page.tsx`
  - `apps/local-dashboard/src/app/dashboard/tables/page.tsx`
  - `apps/local-dashboard/src/app/dashboard/orders/page.tsx`
  - `apps/local-dashboard/src/app/dashboard/settings/profile/page.tsx`
  - `apps/local-dashboard/src/app/api/local/menu/route.ts`
  - `apps/local-dashboard/src/app/api/local/menu/[id]/route.ts`
  - `apps/local-dashboard/src/app/api/local/tables/route.ts`
  - `apps/local-dashboard/src/app/api/local/tables/[id]/route.ts`
  - `apps/local-dashboard/src/app/api/local/orders/route.ts`
  - `apps/local-dashboard/src/app/api/local/profile/route.ts`

---

## 4. Estado de Validacion (QA)

- Pruebas Unitarias Ejecutadas: No
- Pruebas End-to-End (E2E): No
- Notas de Validacion: Verificacion de compilacion TypeScript ejecutada mediante `tsc --noEmit` sin errores. Validacion funcional pendiente: requiere usuario con `role=ADMIN` y `restaurant_id` configurado en Supabase para prueba de flujo completo de autenticacion y operaciones CRUD.

---

## 5. Bloqueos, Deuda Tecnica o Riesgos

- **Riesgo 1:** La pagina `admin-dashboard` no tiene un middleware Next.js funcional (el archivo `src/proxy.ts` usa un named export en lugar de default export, por lo que Next.js no lo procesa). El `local-dashboard` corrige este patron, pero la aplicacion `admin-dashboard` queda con proteccion de rutas solo client-side. Mitigacion: corregir `proxy.ts` en tarea posterior.
- **Riesgo 2:** Las rutas API de `local-dashboard` asumen que las tablas de Supabase (`menu_items`, `tables`, `orders`, `order_items`) existen con los campos esperados. Si el esquema de base de datos difiere, las queries retornaran error 500. Mitigacion: validar esquema contra el codigo antes del despliegue.
- **Deuda Tecnica 1:** Las apps `kitchen-kds` y `cashier-dashboard` (rol CAJERO) estan pendientes de implementacion (Pasos 1 y 3 del plan).

---

## 6. Siguientes Pasos

- Creacion de usuario `ADMIN` en Supabase con `restaurant_id` asignado para validacion funcional del `local-dashboard`.
- Implementacion del Paso 1: agregar pagina de login y middleware al `kitchen-kds` existente (rol `COCINA`, puerto 3001).
- Implementacion del Paso 3: creacion de la aplicacion `cashier-dashboard` (rol `CAJERO`, puerto 3004) con interfaz de punto de venta y gestion de cuentas.
- Correccion del middleware en `admin-dashboard` (conversion de named export a default export en `proxy.ts`).
