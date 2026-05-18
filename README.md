# Menu Bites — Sistema de Gestión Gastronómica Inteligente

Menu Bites es una plataforma SaaS multitenant diseñada para digitalizar y optimizar la operación completa de restaurantes. Integra en un solo ecosistema el portal de pedidos del cliente (vía QR), los sistemas KDS de cocina y barra, la terminal del garzón, la caja, el panel de administración del local y un panel SaaS global.

---

## Tabla de Contenidos

- [Características Principales](#características-principales)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Repositorio](#estructura-del-repositorio)
- [Requisitos Previos](#requisitos-previos)
- [Instalación Paso a Paso](#instalación-paso-a-paso)
- [Variables de Entorno](#variables-de-entorno)
- [Scripts Disponibles](#scripts-disponibles)
- [Aplicaciones y Puertos](#aplicaciones-y-puertos)
- [Instalación de la App Mobile](#instalación-de-la-app-mobile)
- [Documentación](#documentación)

---

## Características Principales

| Aplicación | Puerto | Rol | Descripción |
|---|---|---|---|
| **Admin Dashboard** | 3000 | SUPER_ADMIN | Panel SaaS global: gestión de restaurantes, planes y suscripciones |
| **Kitchen KDS** | 3001 | COCINA | Pantalla de cocina con tickets en tiempo real, prioridades y tiempos |
| **Waiter Terminal** | 3002 | GARZON | Toma de pedidos, gestión de mesas y notificaciones push |
| **Local Dashboard** | 3003 | ADMIN | Menú, inventario, reportes, branding dinámico y alertas |
| **Cashier Dashboard** | 3004 | CAJERO | Cierre de cuentas, procesamiento de pago y facturación |
| **Customer Portal** | 3005 | CLIENTE | Menú digital vía QR, pedidos en mesa y seguimiento en tiempo real |
| **Bar Dashboard** | 3006 | BAR | KDS dedicado para bebidas y cócteles, independiente de cocina |
| **Mobile App** | — | TODOS | App React Native / Expo: todos los roles, push notifications, QR scanner |

### Tecnología Realtime

Todas las vistas operativas (KDS, Waiter, Portal) usan el **Realtime Sync Engine** de Supabase: cada cambio de estado del pedido (PENDING → VALIDATED → PREPARING → READY → DELIVERED → COMPLETED) se propaga instantáneamente a todos los dispositivos conectados sin polling.

### Diseño Multitenant

Cada restaurante es un **tenant aislado**. El `restaurant_id` está embebido en el JWT de Supabase y todas las tablas están protegidas por políticas **Row Level Security (RLS)** que filtran a nivel del motor de base de datos.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend Web | React 19, Next.js 16, TypeScript 5+, TailwindCSS v4, Framer Motion 11 |
| Frontend Mobile | React Native 0.81, Expo SDK 54, Expo Router v6 |
| Backend & BD | Supabase (PostgreSQL 15+, Auth, Realtime, Storage) |
| ORM | Prisma 5.15 |
| Monorepo | Turborepo, npm Workspaces |
| Notificaciones | Web Push API (VAPID) + Expo Notifications |
| Infraestructura | Vercel (Web), Expo EAS (Mobile) |

---

## Estructura del Repositorio

```
Software-Restaurantes/
├── Documentacion/          # Especificaciones técnicas, diagramas, manuales y QA
│   ├── TECHNICAL_SAD.md    # Documento de Arquitectura de Software (SAD) v2.6.0
│   ├── DATABASE_SCHEMA.md  # ERDs, diccionario de datos y políticas RLS
│   ├── API_SPECIFICATION.md
│   ├── USER_MANUAL.md
│   ├── SECURITY_POSTURE.md
│   ├── TEST_PLAN.md
│   └── diagrams/           # SVGs generados automáticamente desde los .md
├── Gestion/                # Planificación, integrantes y reportes de avance
└── Producto/               # Código fuente del sistema (Monorepo Turborepo)
    ├── apps/
    │   ├── admin-dashboard/
    │   ├── kitchen-kds/
    │   ├── waiter-terminal/
    │   ├── local-dashboard/
    │   ├── cashier-dashboard/
    │   ├── customer-portal/
    │   ├── bar-dashboard/
    │   └── mobile/
    ├── packages/
    │   ├── @menu-bites/ui       # Componentes React compartidos
    │   ├── @menu-bites/auth     # Cliente Supabase + hooks Realtime + tipos
    │   └── @menu-bites/store    # Zustand store con persistencia AES
    └── supabase/
        ├── prisma/schema.prisma # Fuente de verdad del modelo de datos
        ├── migrations/          # Migraciones SQL
        └── config.toml
```

---

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

| Herramienta | Versión mínima | Verificar |
|---|---|---|
| **Git** | 2.x | `git --version` |
| **Node.js** | 20.x LTS | `node --version` |
| **npm** | 10.x | `npm --version` |
| **Supabase CLI** | 1.x | `supabase --version` |

Para instalar el Supabase CLI:
```bash
npm install -g supabase
```

También necesitas una cuenta en [Supabase](https://supabase.com) y (opcional) en [Vercel](https://vercel.com) para despliegue.

---

## Instalación Paso a Paso

### Paso 1: Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd Software-Restaurantes
```

### Paso 2: Crear el Proyecto en Supabase

1. Accede a [supabase.com/dashboard](https://supabase.com/dashboard) e inicia sesión.
2. Haz clic en **New project**.
3. Completa los datos:
   - **Name:** `menu-bites` (o el nombre que prefieras)
   - **Database Password:** guarda esta contraseña, la necesitarás para `DATABASE_URL`
   - **Region:** elige la más cercana a tus usuarios
4. Espera a que el proyecto se inicialice (aprox. 1 minuto).
5. En el panel del proyecto, ve a **Settings → API** y copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
6. Ve a **Settings → Database → Connection string → URI (Transaction mode)** y copia la URL → `DATABASE_URL`

### Paso 3: Configurar Variables de Entorno

Desde la carpeta `Producto/`, copia el archivo de ejemplo:

```bash
cd Producto
cp .env.example .env
```

Edita el archivo `.env` con los valores obtenidos en el paso anterior. Ver sección [Variables de Entorno](#variables-de-entorno) para el detalle completo.

### Paso 4: Instalar Dependencias

Desde la carpeta `Producto/` (raíz del monorepo):

```bash
npm install
```

Esto instala las dependencias de todas las aplicaciones y paquetes compartidos en una sola operación.

### Paso 5: Aplicar Migraciones de Base de Datos

Conecta el Supabase CLI a tu proyecto remoto y aplica el esquema:

```bash
# Iniciar sesión en Supabase
supabase login

# Vincular con tu proyecto (obtén el Project ID en Settings → General)
supabase link --project-ref <tu-project-id>

# Aplicar todas las migraciones
supabase db push
```

Esto creará todas las tablas, enums, índices y políticas RLS definidas en `supabase/migrations/`.

**Alternativa con Prisma** (si prefieres manejar el schema localmente):
```bash
npx prisma db push
```

### Paso 6: Generar Claves VAPID para Web Push

Las notificaciones push del garzón requieren claves VAPID:

```bash
npx web-push generate-vapid-keys
```

Copia los valores generados al `.env`:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_EMAIL` → tu correo (ej: `mailto:admin@mirestaurante.com`)

### Paso 7: Crear el Primer Restaurante y Super Admin

1. Ve a tu proyecto Supabase → **Authentication → Users → Add user**.
2. Crea un usuario con email y contraseña.
3. En el **SQL Editor** de Supabase, ejecuta:

```sql
-- Insertar plan gratuito
INSERT INTO plans (id, name, price, period, features, popular)
VALUES (gen_random_uuid(), 'Demo', '$0', '/mes', ARRAY['Hasta 5 mesas', '1 usuario'], false);

-- Insertar restaurante de prueba
INSERT INTO restaurants (id, name, slug, status)
VALUES (gen_random_uuid(), 'Mi Restaurante', 'mi-restaurante', 'ACTIVE');

-- Asignar rol SUPER_ADMIN al usuario (reemplaza el UUID con el ID del usuario creado)
INSERT INTO users (id, email, role)
SELECT id, email, 'SUPER_ADMIN'
FROM auth.users
WHERE email = 'tu@email.com';
```

### Paso 8: Iniciar el Entorno de Desarrollo

Desde `Producto/`, inicia todas las aplicaciones web en paralelo:

```bash
npm run dev
```

Esto levanta simultáneamente los 7 servidores de desarrollo (excluyendo mobile). Cada aplicación estará disponible en su puerto correspondiente.

Para iniciar una aplicación específica:

```bash
# Solo el Local Dashboard
npx turbo dev --filter=local-dashboard

# Solo el Kitchen KDS
npx turbo dev --filter=kitchen-kds
```

### Paso 9: Verificar la Instalación

Abre en el navegador:

- [http://localhost:3000](http://localhost:3000) → Admin Dashboard
- [http://localhost:3003/mi-restaurante/dashboard](http://localhost:3003/mi-restaurante/dashboard) → Local Dashboard
- [http://localhost:3001](http://localhost:3001) → Kitchen KDS
- [http://localhost:3006](http://localhost:3006) → Bar Dashboard
- [http://localhost:3005/mi-restaurante/1](http://localhost:3005/mi-restaurante/1) → Customer Portal (mesa 1)

---

## Variables de Entorno

El archivo `Producto/.env` debe contener todas las siguientes variables:

```bash
# ── Supabase (Público) ─────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://tu-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ── Supabase (Privado — nunca exponer al cliente) ─────────────────────────────
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ── Base de Datos (Prisma) ────────────────────────────────────────────────────
# Transaction mode (pooler) — para Prisma en producción
DATABASE_URL=postgresql://postgres.xxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Direct connection — para migraciones (supabase db push / prisma migrate)
DIRECT_URL=postgresql://postgres.xxxx:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres

# ── Autenticación (URLs inter-app) ────────────────────────────────────────────
# URL del admin-dashboard (centraliza el login)
NEXT_PUBLIC_AUTH_URL=http://localhost:3000

# ── Web Push Notifications (VAPID) ───────────────────────────────────────────
# Clave pública (va al cliente / Service Worker)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BNxxx...

# Clave privada (solo servidor — waiter-terminal/api/notify)
VAPID_PRIVATE_KEY=xxx...

# Email de contacto para el servidor VAPID
VAPID_EMAIL=mailto:admin@mirestaurante.com
```

> **Seguridad:** Las variables sin prefijo `NEXT_PUBLIC_` son exclusivamente del lado del servidor. Nunca las expongas en el cliente ni las subas a un repositorio público.

---

## Scripts Disponibles

Todos los scripts se ejecutan desde `Producto/`:

| Script | Descripción |
|---|---|
| `npm run dev` | Inicia todas las apps web en modo desarrollo (excluye mobile) |
| `npm run dev:all` | Inicia todas las apps incluyendo mobile |
| `npm run dev:mobile` | Inicia solo la app mobile (Expo) |
| `npm run build` | Compila todas las apps para producción |
| `npm run lint` | Análisis estático de código en todo el monorepo |
| `npm run format` | Formatea el código con Prettier |

Para iniciar una app específica:
```bash
npx turbo dev --filter=<nombre-app>
```

---

## Aplicaciones y Puertos

| App | Puerto Dev | URL de acceso | Rol requerido |
|---|---|---|---|
| `admin-dashboard` | **3000** | http://localhost:3000 | SUPER_ADMIN |
| `kitchen-kds` | **3001** | http://localhost:3001/login | COCINA |
| `waiter-terminal` | **3002** | http://localhost:3002/login | GARZON |
| `local-dashboard` | **3003** | http://localhost:3003/[slug]/dashboard | ADMIN |
| `cashier-dashboard` | **3004** | http://localhost:3004/login | CAJERO |
| `customer-portal` | **3005** | http://localhost:3005/[slug]/[mesa] | Público (QR) |
| `bar-dashboard` | **3006** | http://localhost:3006/login | BAR |

> El `[slug]` corresponde al campo `slug` del restaurante en la base de datos (ej: `mi-restaurante`).

---

## Instalación de la App Mobile

La app mobile usa **Expo SDK 54** y requiere configuración adicional.

### Requisitos Mobile

- Expo CLI: `npm install -g expo-cli`
- Para iOS: Xcode 14+ (solo en macOS)
- Para Android: Android Studio con SDK 33+
- Expo Go app en tu dispositivo físico (para desarrollo rápido)

### Pasos

```bash
# Desde Producto/apps/mobile/
cd apps/mobile

# Instalar dependencias de la app
npm install

# Iniciar el servidor de Expo
npx expo start
```

Escanea el QR con la app **Expo Go** en tu dispositivo o presiona:
- `a` para abrir en emulador Android
- `i` para abrir en simulador iOS

### Build de Producción (EAS)

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Autenticar con Expo
eas login

# Build para Android (APK)
eas build --platform android --profile preview

# Build para iOS (IPA)
eas build --platform ios --profile preview
```

---

## Flujos de Operación

### Ciclo de Vida del Pedido

```mermaid
graph LR
    A[Cliente escanea QR] --> B[Selecciona items]
    B --> C[Pedido PENDING]
    C -->|Garzón valida| D[VALIDATED]
    D -->|KDS Cocina acepta| E[PREPARING KITCHEN]
    D -->|KDS Barra acepta| F[PREPARING BAR]
    E -->|Chef termina| G[READY KITCHEN]
    F -->|Barman termina| H[READY BAR]
    G --> I[Garzón entrega]
    H --> I
    I --> J[DELIVERED]
    J -->|Cajero procesa pago| K[COMPLETED]
    style K fill:#10b981,color:#fff
    style C fill:#f59e0b,color:#fff
```

### Arquitectura del Monorepo

```mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'primaryColor': '#6366f1',
    'primaryTextColor': '#ffffff',
    'primaryBorderColor': '#4f46e5',
    'lineColor': '#94a3b8',
    'secondaryColor': '#10b981',
    'tertiaryColor': '#f8fafc',
    'fontFamily': 'Inter, sans-serif'
  }
}}%%
graph TD
    subgraph Monorepo ["Producto (Turborepo + npm Workspaces)"]
        direction TB
        A[Apps] --> B[admin-dashboard :3000]
        A --> C[local-dashboard :3003]
        A --> D[kitchen-kds :3001]
        A --> E[waiter-terminal :3002]
        A --> F[cashier-dashboard :3004]
        A --> G[customer-portal :3005]
        A --> H[bar-dashboard :3006]
        A --> I[mobile Expo]

        P[Packages] --> UI["@menu-bites/ui"]
        P --> AUTH["@menu-bites/auth"]
        P --> STORE["@menu-bites/store"]

        B & C & D & E & F & G & H -.->|importa| UI
        B & C & D & E & F & G & H -.->|importa| AUTH
        B & C & D -.->|importa| STORE
    end

    subgraph Backend ["Supabase"]
        DB[(PostgreSQL + RLS)]
        RT[Realtime Engine]
        AU[Auth - JWT]
        ST[Storage - Imágenes]
    end

    AUTH -->|cliente| DB
    AUTH -->|suscripciones| RT
    AUTH -->|sesión| AU
```

### Flujo de Datos Multi-tenant (Seguridad)

```mermaid
sequenceDiagram
    participant C as Cliente (Navegador)
    participant M as Middleware Next.js
    participant S as Supabase Auth
    participant D as PostgreSQL + RLS

    C->>M: GET /mi-restaurante/dashboard
    M->>S: Validar JWT + rol
    S-->>M: JWT válido, role=ADMIN, restaurant_id=abc
    M->>D: SELECT * FROM orders WHERE restaurant_id=abc
    D->>D: RLS: filtra por restaurant_id del JWT
    D-->>C: Solo datos del restaurante abc
```

---

## Seguridad

- **RLS (Row Level Security):** Todas las tablas transaccionales filtran por `restaurant_id` del JWT. Sin RLS no hay acceso.
- **Cookies HttpOnly:** Las sesiones se almacenan en cookies inaccesibles desde JavaScript.
- **AES Encryption:** Los tokens en `localStorage` están cifrados con clave derivada de `hostname + userAgent`.
- **VAPID:** Las claves privadas de Web Push nunca salen del servidor.
- **Aislamiento de sesiones:** Cada app usa una cookie de sesión distinta (`sb-local-session`, `sb-admin-session`, etc.) para permitir múltiples apps en localhost sin conflictos.

---

## Testing

El proyecto cuenta con **651 pruebas** distribuidas en 12 workspaces, más pruebas E2E con Playwright.

### Estructura de pruebas

```
Producto/
├── packages/
│   ├── auth/src/__tests__/
│   │   ├── utils.test.ts      # mapOrder, formatCLP, timeAgo, diffMinutes…
│   │   ├── index.test.ts      # updateOrderStatus, sendAlert
│   │   └── constants.test.ts  # ORDER_STATUS_LABEL, TABLE_STATUS_LABEL
│   ├── store/src/__tests__/
│   │   └── store.test.ts      # useAuthStore: setUser, logout, cifrado AES
│   └── ui/src/__tests__/
│       ├── utils.test.ts      # cn, formatDate, formatPrice, timeAgo
│       └── Badge.test.tsx     # Componente Badge, todas las variantes
└── e2e/
    ├── customer-portal.spec.ts  # Portal público (sin auth)
    └── admin-login.spec.ts      # Flujo de login
```

### Ejecutar las pruebas

**Todos los paquetes compartidos (recomendado):**
```bash
npm test
```

**Un paquete específico:**
```bash
npx turbo test --filter="@menu-bites/auth"
npx turbo test --filter="@menu-bites/store"
npx turbo test --filter="@menu-bites/ui"
```

**Modo watch (desarrollo):**
```bash
cd packages/auth && npm run test:watch
cd packages/store && npm run test:watch
cd packages/ui   && npm run test:watch
```

**Con reporte de cobertura:**
```bash
cd packages/auth && npm run test:coverage
```

### Pruebas E2E con Playwright

> Las apps deben estar corriendo antes de ejecutar los tests E2E.

```bash
# 1. Levantar el servidor de desarrollo
npm run dev

# 2. Ejecutar los tests E2E
npm run test:e2e

# 3. Modo UI interactivo (recomendado para depurar)
npm run test:e2e:ui
```

**Variables de entorno opcionales para E2E:**

| Variable | Descripción | Default |
|----------|-------------|---------|
| `E2E_BASE_URL` | URL del customer-portal | `http://localhost:3005` |
| `E2E_ADMIN_URL` | URL del admin-dashboard | `http://localhost:3000` |
| `E2E_TEST_EMAIL` | Email de usuario de prueba | — |
| `E2E_TEST_PASSWORD` | Contraseña del usuario de prueba | — |

> Si `E2E_TEST_EMAIL` y `E2E_TEST_PASSWORD` no están definidos, el test de login exitoso se omite automáticamente.

---

## Documentación

Toda la documentación técnica está en la carpeta `Documentacion/`:

| Archivo | Descripción |
|---|---|
| [TECHNICAL_SAD.md](Documentacion/TECHNICAL_SAD.md) | Documento de Arquitectura de Software — diseño, patrones y decisiones técnicas |
| [DATABASE_SCHEMA.md](Documentacion/DATABASE_SCHEMA.md) | Modelo de datos: ERDs, diccionario de datos y políticas RLS |
| [DATABASE_TECHNICAL.md](Documentacion/DATABASE_TECHNICAL.md) | Roles de BD, configuración de RLS y SQL de políticas |
| [API_SPECIFICATION.md](Documentacion/API_SPECIFICATION.md) | Endpoints REST, webhooks y especificación de la API Realtime |
| [USER_MANUAL.md](Documentacion/USER_MANUAL.md) | Manual de usuario para cada aplicación del ecosistema |
| [SECURITY_POSTURE.md](Documentacion/SECURITY_POSTURE.md) | Modelo de defensa en profundidad y controles de seguridad |
| [TEST_PLAN.md](Documentacion/TEST_PLAN.md) | Plan de pruebas: estrategia, criterios de aceptación y flujos E2E |
| [diagrams/index.html](Documentacion/diagrams/index.html) | Galería visual de todos los diagramas del proyecto |

---

© 2026 Menu Bites Team. Todos los derechos reservados.
