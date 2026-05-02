# CLAUDE.md — Software-Restaurantes (v1.2.0)

## 1. CONTEXTO DEL PROYECTO

**Misión:** Plataforma integral para la gestión de restaurantes con arquitectura Monorepo (Turbo/pnpm).
**Repositorio Original:** `https://github.com/Hctr2002/Software-Restaurantes.git`
**Estado Actual:** Sincronizado localmente en `projects/PROJ-Software-restaurante-Duoc`.

---

## 2. FUENTE DE VERDAD — OBLIGATORIO ANTES DE CREAR PÁGINAS O TIPOS

> **REGLA CRÍTICA:** Antes de escribir cualquier tipo TypeScript, página, componente o API route que acceda a la base de datos, DEBES leer primero:

| Archivo | Propósito |
| --- | --- |
| `Producto/supabase/prisma/schema.prisma` | Modelos, tipos de datos, enums, nombres de columnas y relaciones |
| `Producto/supabase/migrations/` | Migraciones SQL — confirman el nombre real de las columnas en PostgreSQL |

### Nombres: Prisma es la fuente de verdad

Los nombres de campos, tablas y enums DEBEN coincidir exactamente con los definidos en `schema.prisma`. No inventar nombres, no suponer.

Prisma usa `@map()` para mapear campos camelCase a columnas snake_case. El cliente REST de Supabase devuelve los **nombres de columna de la base de datos** (snake_case).

| Campo Prisma (camelCase) | Columna DB (snake_case) | Devuelve Supabase REST |
| --- | --- | --- |
| `categoryId` | `category_id` | `category_id` |
| `unitPrice` | `unit_price` | `unit_price` |
| `tableId` | `table_id` | `table_id` |
| `restaurantId` | `restaurant_id` | `restaurant_id` |
| `isActive` | `is_active` | `is_active` |
| `createdAt` | `createdAt` (sin @map) | `createdAt` |

**Para exponer camelCase al frontend**, usar aliasing de PostgREST en el `.select()`:

```ts
.select("id, category_id:categoryId, unit_price:unitPrice, table_id:tableId")
```

### Enums válidos — solo los del schema.prisma

- **Role:** `SUPER_ADMIN`, `ADMIN`, `GARZON`, `COCINA`, `CLIENTE` — `CAJERO` NO existe.
- **OrderStatus:** `PENDING`, `VALIDATED`, `PREPARING`, `READY`, `DELIVERED`, `REJECTED`
- **TableStatus:** `FREE`, `OCCUPIED`, `RESERVED`
- **SubscriptionStatus:** `ACTIVE`, `SUSPENDED`, `CANCELLED`

### Relaciones Supabase REST

Las relaciones se piden con el **nombre de la tabla** (snake_case plural) y devuelven ese mismo nombre como clave:

```ts
.select("*, order_items(id, unit_price), tables(number)")
// → { order_items: [...], tables: { number: 1 } }
```

---

## 3. SUPABASE — SERVICIOS ESTÁNDAR DEL PROYECTO

### 3.1 Autenticación — Supabase Auth

Toda autenticación usa **Supabase Auth**. No implementar sistemas de auth propios.

- Login, logout y sesiones → `supabase.auth.*`
- El rol del usuario vive en `session.user.app_metadata.role`
- El `restaurant_id` del usuario vive en `session.user.app_metadata.restaurant_id`
- Usar `@menu-bites/auth` (paquete compartido) para acceder al cliente Supabase y a los helpers de sesión

```ts
import { supabase, getSession, signOut } from "@menu-bites/auth";
```

### 3.2 Realtime — Supabase Realtime

**PROHIBIDO usar `setInterval` para actualizar datos.** Toda actualización en tiempo real de vistas y notificaciones usa `supabase.channel().on('postgres_changes', ...)`.

Patrón obligatorio:

```ts
import { supabase } from "@menu-bites/auth";

useEffect(() => {
  fetchData(); // carga inicial

  const channel = supabase
    .channel("nombre-descriptivo-del-canal")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders" },
      () => { fetchData(); }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [fetchData]);
```

Casos de uso Realtime en este proyecto:

| Vista | Tabla a escuchar |
| --- | --- |
| Kitchen KDS | `orders` |
| Waiter Terminal | `orders`, `tables` |
| Local Dashboard (pedidos) | `orders` |
| Local Dashboard (mesas) | `tables` |

### 3.3 Storage — Supabase Storage

Las imágenes (ej. fotos de `menu_items`) se guardan en **Supabase Storage**, no en Base64 ni en servidores externos.

```ts
// Subir imagen
const { data, error } = await supabase.storage
  .from("menu-images")
  .upload(`${restaurantId}/${fileName}`, file, { upsert: true });

// URL pública
const { data: { publicUrl } } = supabase.storage
  .from("menu-images")
  .getPublicUrl(`${restaurantId}/${fileName}`);
```

- Bucket: `menu-images` (público)
- Ruta: `{restaurantId}/{fileName}` para aislar imágenes por restaurante
- El campo `imageUrl` en `MenuItem` guarda la URL pública devuelta por Storage

---

## 4. COMPONENTES COMPARTIDOS — NO DUPLICAR

### 4.1 Usar el paquete UI antes de crear algo nuevo

Antes de crear un componente, verificar si ya existe en `Producto/packages/ui/src/`:

| Componente | Importar desde |
| --- | --- |
| `Badge`, `BadgeVariant` | `@menu-bites/ui` |
| `Modal` | `@menu-bites/ui` |
| `Table`, `TableRow`, `TableCell` | `@menu-bites/ui` |
| `Button`, `Input`, `Card`, `CardContent`, … | `@menu-bites/ui` |
| `OrderTicket` | `@menu-bites/ui` |
| `cn` (classnames helper) | `@menu-bites/ui` |
| `formatPrice`, `formatDate`, `timeAgo` | `localShared.ts` del app correspondiente |

### 4.2 Regla de componente reutilizable

Si una pieza de UI o lógica **aparece en dos o más vistas**, debe convertirse en un componente o función en:

- `Producto/packages/ui/src/components/` → si es visual y cross-app
- `src/app/dashboard/_components/` → si es específico del app local

No copiar y pegar código entre páginas.

---

## 5. LÍMITE DE LÍNEAS Y CLEAN CODE

### 5.1 Máximo 400 líneas por archivo `.tsx`

Si un archivo supera las **400 líneas**, se deben extraer partes en componentes separados. Estrategia:

- Formularios → `<NombreForm />` en archivo propio
- Modales → `<NombreModal />` en archivo propio
- Tablas con lógica propia → `<NombreTable />` en archivo propio
- Secciones del dashboard → sub-componentes en `_components/`

### 5.2 Buenas prácticas obligatorias

**Naming:**

- Componentes: `PascalCase` (`OrderTicket`, `KDSColumn`)
- Funciones y variables: `camelCase` (`fetchOrders`, `handleStatusChange`)
- Constantes globales: `UPPER_SNAKE_CASE` (`MOCK_ORDERS`, `NEXT_STATUS`)
- Archivos de componentes: `PascalCase.tsx`; páginas: `page.tsx`

**Funciones:**

- Una función = una responsabilidad
- Si un `useEffect` hace más de una cosa, separarlo en dos `useEffect`
- Extraer lógica de negocio compleja fuera del componente (funciones puras)

**Estado:**

- Preferir múltiples `useState` pequeños a un objeto de estado grande
- No guardar en estado lo que se puede derivar (calcular en render)

**Tipos:**

- No usar `any` salvo en integraciones externas donde es inevitable; preferir `unknown` y hacer type guard
- Definir tipos en `localShared.ts` del app o en `packages/ui` si son cross-app
- Usar los tipos directamente del `schema.prisma` como referencia — no inventar formas de datos

**Importaciones:**

- Agrupar en este orden: librerías externas → paquetes internos (`@menu-bites/*`) → imports relativos locales
- No importar archivos que no se usan

**Comentarios:**

- No comentar lo que el código ya dice; comentar solo el **por qué** si es no obvio
- Eliminar `console.log` de debug antes de hacer PR

---

## 6. COMANDOS ÚTILES

- Iniciar Dev: `pnpm run dev` o `npm run dev`
- Build: `pnpm run build` o `npm run build`
- Pruebas: `pnpm run test`
- Instalar Dependencias: `pnpm install` o `npm install`

---

## 7. ESTILO DE CÓDIGO (OLYMP-IA STANDARD)

- **UI:** Seguir guía de estilos de Magic MCP (Vibrance/Glassmorphism).
- **Semántica:** HTML5 estricto para accesibilidad.
- **Git:** Art. 2.2 (No commits sin permiso directo).

## 8. REGLAS OLYMP-IA (CONSTITUCIÓN V2.2.0+)

- **Art. 1 (Ambigüedad):** Prohibido ejecutar sobre términos vagos.
- **Art. 2 (Gated Pipeline):** Esperar "APROBADO" antes de cambios estructurales.
- **Art. 4 (Persistencia):** Registro obligatorio en `memoria.md`.

## 9. MÓDULO DE CONTINUIDAD

Leer siempre `task.md` y `memoria.md` para recuperar el estado mental del agente anterior.

---

Desarrollado por OLYMP-IA · Supremacía Digital

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **Software-Restaurantes** (674 symbols, 1319 relationships, 46 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/Software-Restaurantes/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/Software-Restaurantes/context` | Codebase overview, check index freshness |
| `gitnexus://repo/Software-Restaurantes/clusters` | All functional areas |
| `gitnexus://repo/Software-Restaurantes/processes` | All execution flows |
| `gitnexus://repo/Software-Restaurantes/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
npx gitnexus analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
