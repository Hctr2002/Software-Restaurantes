# Plan de Implementación: Integración de Diseño "Menu Bites"

Este plan detalla cómo transformar las pantallas existentes (actualmente en estado "boilerplate") en las interfaces premium de **MENU BITES** utilizando el sistema de componentes del monorepo.

## User Review Required

> [!IMPORTANT]
> **Compatibilidad de Colores:** Los mockups usan `OKLCH` para una precisión visual superior, mientras que el proyecto actual usa `HSL` (estándar de shadcn). Mi propuesta es migrar el proyecto a `OKLCH` en el `globals.css` principal para mantener la fidelidad del diseño "Wow Factor".

## Estructura de Pantallas Actuales

Tras auditar el código, confirmo que **existen rutas funcionales** pero visualmente básicas en:
- `apps/admin-dashboard/src/app`: Tiene `/dashboard`, `/restaurants`, `/users`.
- `packages/ui/src/components`: Tiene componentes base como `OrderTicket`, `TableGrid`, y `TableCard`.

##Proposed Changes

### [Módulo: Shared UI](file:///home/alejandro/Olymp-ia/projects/PROJ-Software-restaurante-Duoc/Software-Restaurantes/packages/ui)

#### [MODIFY] [tailwind.config.js](file:///home/alejandro/Olymp-ia/projects/PROJ-Software-restaurante-Duoc/Software-Restaurantes/packages/ui/tailwind.config.js)
- Registrar los nuevos colores de marca: `navy`, `sage`, `sand`, `accent`.
- Configurar escalas de espaciado y bordes orgánicos (Radius 32px/40px).

#### [MODIFY] [Componentes Base](file:///home/alejandro/Olymp-ia/projects/PROJ-Software-restaurante-Duoc/Software-Restaurantes/packages/ui/src/components)
- Actualizar `OrderTicket.tsx` y otros para usar los colores `sage` (listo) y `accent` (en preparación) en lugar de los colores genéricos de Tailwind.

### [Módulo: Admin Dashboard](file:///home/alejandro/Olymp-ia/projects/PROJ-Software-restaurante-Duoc/Software-Restaurantes/apps/admin-dashboard)

#### [MODIFY] [globals.css](file:///home/alejandro/Olymp-ia/projects/PROJ-Software-restaurante-Duoc/Software-Restaurantes/apps/admin-dashboard/src/app/globals.css)
- Inyectar las variables OKLCH y las animaciones de vidrio/vidrio esmerilado presentes en los mockups.

#### [MODIFY] [Dashboard Layout](file:///home/alejandro/Olymp-ia/projects/PROJ-Software-restaurante-Duoc/Software-Restaurantes/apps/admin-dashboard/src/app/dashboard/layout.tsx)
- Reemplazar el `SidebarShell` genérico por la navegación premium asimétrica del diseño actual.

## Plan de Verificación

### Pasos de Validación
1. Ejecutar el entorno de desarrollo (`npm run dev`) y verificar que las nuevas variables de color se apliquen correctamente.
2. Comparar visualmente la pantalla de `/dashboard` con el mockup `admin.html`.

---
¿Deseas que comience con la sincronización de los **Design Tokens** (Colores y Variables) en la configuración de Tailwind del monorepo?
