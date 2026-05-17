# admin-dashboard — Panel de Administración Global

Aplicación Next.js 16 (App Router) para el rol `SUPER_ADMIN`. Gestiona restaurantes, suscripciones, usuarios globales y métricas de la plataforma SaaS Menu Bites.

## Puerto de desarrollo

```text
http://localhost:3000
```

## Rol requerido

`SUPER_ADMIN` — acceso otorgado desde la base de datos por un administrador del sistema.

## Responsabilidades

* Gestión de restaurantes (alta, baja, cambio de plan)
* Administración de usuarios globales
* Monitoreo de métricas y estado de la plataforma
* Configuración de suscripciones

## Comandos

Ejecutar desde la raíz del monorepo (`Producto/`):

```bash
# Solo esta app
turbo dev --filter=admin-dashboard

# Todas las apps
npm run dev
```

## Estructura relevante

```text
src/
  app/
    dashboard/        # Páginas del panel de administración
    login/            # Página de inicio de sesión
    AdminThemeWrapper.tsx
    layout.tsx
```

## Dependencias internas

* `@menu-bites/auth` — cliente Supabase, hooks y tipos
* `@menu-bites/ui` — componentes compartidos
* `@menu-bites/store` — estado de autenticación
