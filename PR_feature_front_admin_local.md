# Pull Request: feature/front_admin_local -> develop

## Titulo

feat: sistema de temas por restaurante, cookies de sesion por app y callbacks de auth

---

## Descripcion general

Esta rama integra el modulo de branding y temas visuales para que cada restaurante pueda personalizar la apariencia de su panel administrativo (local-dashboard). Tambien resuelve un problema critico de conflicto de sesiones cuando multiples apps del monorepo corren simultameamente en localhost, y agrega las paginas de callback de autenticacion que faltaban en cuatro apps.

---

## Commits incluidos en esta rama (sobre develop)

| Hash | Tipo | Descripcion |
|---|---|---|
| `5c04fb4` | feat | Sistema de temas, cookies por app, auth callbacks, limpieza gitignore |
| `5480682` | fix | Renombrar proxy.ts a middleware.ts en todas las apps |
| `05afc31` | chore | Eliminar archivos .new residuales de resolucion de conflictos |
| `1715b81` | merge | Integrar origin/develop — resolver conflictos de rutas menu y tables |
| `de71ae0` | feat | Agregar rol CAJERO: schema, tipos auth, selectores de rol |
| `1e45697` | merge | PR #26 — fix menu y tables con QR |
| `bb75d46` | fix | Creacion de menu items, creacion de mesas, funcionalidad de QR |
| `99be2ef` | merge | Actualizar desde feature/customer-portal-setup |
| `850a09b` | feat | Slug-routing centralizado y limpieza de hardcodes de auth |
| `a385e47` | feat | Arquitectura multitenant por slug en customer-portal |
| `a953aec` | feat | Slug routing, sistema de alertas, cashier-dashboard, middlewares de seguridad |
| `3d8ac87` | feat | Customer-portal: menu premium oscuro con Supabase Realtime |

---

## Cambios tecnicos detallados

### 1. Base de datos — schema.prisma

Nuevo modelo `Theme` que mapea a la tabla `restaurant_themes`:

- Campos: `primaryColor`, `secondaryColor`, `backgroundColor`, `accentColor`, `textColor`, `cardBackground`, `fontTitle`, `fontBody`, `logoUrl`
- Relacion de cascada con `Restaurant`
- Indice sobre `restaurant_id`
- Requiere migracion SQL antes de desplegar en produccion

### 2. Paquete @menu-bites/auth

**Cookie de sesion por app**

Se agrega la variable de entorno `NEXT_PUBLIC_APP_KEY` en el `createBrowserClient` de Supabase SSR para nombrar la cookie como `sb-{appKey}-session`. Esto evita que las sesiones de distintas apps se sobreescriban cuando corren en el mismo dominio localhost.

**Nuevo helper `getRestaurantTheme(restaurantId)`**

Consulta la tabla `restaurant_themes` filtrando por `is_active = true` y devuelve el objeto de tema normalizado en camelCase listo para el frontend.

### 3. Paquete @menu-bites/ui

**Nuevo componente `RestaurantThemeProvider`**

Recibe un objeto `RestaurantTheme` opcional y un flag `isGlobal`. Cuando `isGlobal` es `true`, inyecta CSS custom properties en `:root` del documento (`--color-primary`, `--background`, `--foreground`, etc.), permitiendo que todo el arbol de componentes responda al tema sin necesidad de prop-drilling.

### 4. local-dashboard — Modulo de Branding

| Archivo | Descripcion |
|---|---|
| `_components/LocalShell.tsx` | Carga el tema activo al montar. Escucha cambios via Supabase Realtime (`postgres_changes` sobre `restaurant_themes`) y via evento DOM `theme-updated` disparado desde la pagina de branding |
| `settings/branding/page.tsx` | Nueva pagina de configuracion visual: selector de paletas predefinidas y editor de colores personalizados |
| `api/local/theme/route.ts` | Ruta API `GET /api/local/theme` y `POST /api/local/theme` para leer y persistir el tema activo del restaurante autenticado |
| `lib/constants/palettes.ts` | Paletas de color predefinidas (constantes) |
| `lib/schemas/themeSchema.ts` | Esquema Zod para validacion del payload del tema |
| `lib/services/themeService.ts` | Funciones de acceso a `restaurant_themes` via Supabase client |

### 5. Auth callbacks — cuatro apps

Se agrega `src/app/auth/callback/page.tsx` en:

- `cashier-dashboard`
- `kitchen-kds`
- `local-dashboard`
- `waiter-terminal`

Esta pagina maneja el exchange de codigo OAuth y Magic Link de Supabase Auth al redirigir despues del login. Su ausencia causaba errores 404 al completar el flujo de autenticacion.

### 6. next.config.mjs — todas las apps afectadas

Se agrega el bloque `env` con `NEXT_PUBLIC_APP_KEY` en cada app. Valores asignados:

| App | NEXT_PUBLIC_APP_KEY |
|---|---|
| admin-dashboard | `admin` |
| cashier-dashboard | `cashier` |
| kitchen-kds | `kitchen` |
| local-dashboard | `local` |
| waiter-terminal | `waiter` |

### 7. .gitignore

- Agrega `**/tsconfig.tsbuildinfo` (artefacto de build de TypeScript)
- Agrega 35 directorios de herramientas AI/LLM bajo `Producto/` (`.claude/`, `.windsurf/`, `.augment/`, etc.)
- Agrega `Producto/apps/local-dashboard/scratch/` y `color_proposals.html`
- Agrega `Producto/skills/` (definiciones de habilidades de agentes OLYMP-IA)
- Desregistra `memoria.md` y `tsconfig.tsbuildinfo` del indice git (`git rm --cached`)

---

## Impacto y riesgos

| Area | Nivel | Descripcion |
|---|---|---|
| Sesiones de auth en desarrollo | Medio | El cambio de nombre de cookie invalida sesiones activas. Los desarrolladores deben cerrar sesion y volver a entrar una vez desplegado |
| UI de local-dashboard | Bajo | `LocalShell` reemplaza clases Slate hardcodeadas (`bg-slate-950`) por variables CSS (`bg-background`, `text-foreground`). Requiere verificacion visual |
| Otras apps (cashier, kitchen, waiter) | Bajo | Solo se agrega `NEXT_PUBLIC_APP_KEY` y el callback de auth. Sin cambios de logica |
| Schema de base de datos | Bajo | Solo se agrega el modelo `Theme`. No se modifican tablas existentes |
| Paquetes compartidos (@menu-bites/auth, @menu-bites/ui) | Medio | Los cambios en `auth` afectan la inicializacion del cliente Supabase en todas las apps |

---

## Checklist previo al merge

- [ ] Ejecutar migracion SQL de la tabla `restaurant_themes` en Supabase (staging y produccion)
- [ ] Configurar la variable `NEXT_PUBLIC_APP_KEY` en Vercel para cada app
- [ ] Verificar politicas RLS en `restaurant_themes`: solo el rol `ADMIN` del restaurante debe poder escribir
- [ ] Verificar que el bucket `menu-images` en Supabase Storage acepta la URL del `logo_url`
- [ ] Probar el flujo de login completo en cada app con el nuevo auth callback
- [ ] Verificar que no se rompe la sesion de cashier ni kitchen al correr ambas en paralelo en localhost
- [ ] 04_Auditor: ejecutar `zap-cli` y `playwright` — veredicto PASS requerido antes del merge

---

## Archivos nuevos agregados

```
Producto/apps/cashier-dashboard/src/app/auth/callback/page.tsx
Producto/apps/kitchen-kds/src/app/auth/callback/page.tsx
Producto/apps/local-dashboard/src/app/auth/callback/page.tsx
Producto/apps/local-dashboard/src/app/[slug]/dashboard/settings/branding/page.tsx
Producto/apps/local-dashboard/src/app/api/local/theme/route.ts
Producto/apps/local-dashboard/src/lib/constants/palettes.ts
Producto/apps/local-dashboard/src/lib/schemas/themeSchema.ts
Producto/apps/local-dashboard/src/lib/services/themeService.ts
Producto/apps/waiter-terminal/src/app/auth/callback/page.tsx
Producto/packages/ui/src/components/RestaurantThemeProvider.tsx
```

## Archivos eliminados del seguimiento git

```
Producto/apps/local-dashboard/tsconfig.tsbuildinfo  (artefacto de build)
Producto/memoria.md                                  (archivo de sesion interna)
```

---

Rama: `feature/front_admin_local`
Base: `develop`
Autor: cucholambreta
Fecha: 2026-05-03
