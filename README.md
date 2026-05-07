# Menu Bites — Sistema de Gestión Gastronómica Inteligente

Menu Bites es una plataforma SaaS multitenant de vanguardia diseñada para transformar la experiencia operativa en la industria gastronómica. Desde la administración centralizada hasta la interacción digital en mesa, el sistema ofrece una solución integral, rápida y reactiva en tiempo real.

---

## Características Principales

### Ecosistema Multitarea
*   **Customer Portal:** Acceso instantáneo mediante QR. Pedidos en mesa, seguimiento en tiempo real y solicitud de cuenta sin esperas.
*   **Waiter Terminal:** Gestión ágil de mesas, toma de pedidos optimizada y notificaciones push para platos listos.
*   **Kitchen KDS (Kitchen Display System):** Visualización inteligente de tickets por prioridad, tiempos de preparación y comunicación directa con sala.
*   **Cashier Dashboard:** Cierre de cuentas, gestión de métodos de pago y facturación rápida.
*   **Local Dashboard:** Control total del restaurante: gestión de menú, inventario, reportes de ventas y configuración de marca.
*   **Admin Dashboard:** Panel global para la gestión de suscripciones, soporte y monitoreo de la plataforma SaaS.

### Tecnología Realtime
Olvídese de las recargas manuales. Gracias al **Realtime Sync Engine** basado en Supabase, cada cambio de estado (Pedido recibido -> En preparación -> Listo -> Pagado) se refleja instantáneamente en todos los dispositivos conectados.

### Diseño Premium & UX
*   **Branding Dinámico:** Personalización total de colores y estilos para cada restaurante.
*   **Interfaz Pro Max:** Animaciones fluidas con framer-motion y un diseño responsivo que se adapta a tablets, móviles y desktops.
*   **Web Push Notifications:** Notificaciones directas al dispositivo para alertas críticas.

---

## Flujos de Operación

### Ciclo de Vida del Pedido
```mermaid
graph LR
    A[Nuevo Pedido] -->|Cocina acepta| B[En Preparación]
    B -->|Chef termina| C[Listo para Entrega]
    C -->|Caja procesa pago| D[Completado]
    style D fill:#10b981,color:#fff
```

### Arquitectura de Alertas (Realtime)
```mermaid
graph TD
    subgraph "Cliente (Navegador)"
        UI[AlertsPanel UI]
        Hook[useAlerts Hook]
        Audio[Audio Notificación]
    end

    subgraph "Infraestructura (Supabase)"
        RT[Realtime Engine]
        DB[(PostgreSQL)]
    end

    UI --> Hook
    Hook -->|Suscripción| RT
    RT -->|Evento de Tabla| Hook
    Hook -->|Evento de Nuevo Item| UI
    UI -->|Reproducir| Audio
    Hook -->|Lectura PENDING| DB
```

### Proceso de Importación de Inventario
```mermaid
graph TD
    Start[Inicio: Carga Archivo CSV] --> Validate{¿Formato Válido?}
    Validate -- No --> Error[Feedback: Error de Formato]
    Validate -- Sí --> Process[Procesamiento de Lotes]
    Process --> Update[(Base de Datos)]
    Update --> Sync[Sincronización Realtime]
    Sync --> End[Fin: Inventario Actualizado]
    
    style Error fill:#ef4444,color:#fff
    style Update fill:#3b82f6,color:#fff
    style End fill:#10b981,color:#fff
```

### Estructura Modular del Local Dashboard (Clean Code)
```mermaid
graph TD
    subgraph "Local Dashboard Page"
        P[Page Orchestrator] --> S[LocalShell Layout]
    end

    subgraph "Modules"
        S --> B[Branding Module]
        S --> I[Inventory Module]
        S --> R[Reports Module]
        S --> A[Alerts System]
    end

    subgraph "Modular Components"
        B --> B1[ColorLaboratory]
        B --> B2[TypographyManager]
        B --> B3[CorporateIdentity]
        
        A --> A1[useAlerts Hook]
        A --> A2[AlertItem Component]
        
        R --> R1[useReportsData Hook]
        R1 --> R2[reportUtils Helpers]
    end
```

### Flujo de Datos Multi-tenant
```mermaid
sequenceDiagram
    participant C as Cliente (QR/URL)
    participant M as Middleware (Slug/Tenant)
    participant S as Supabase (Auth/RLS)
    participant D as Base de Datos

    C->>M: Petición con Slug (ej: /restaurante-la-plaza)
    M->>S: Validación de Sesión/JWT
    S->>D: Consulta con RLS (Tenant ID)
    D-->>C: Datos Filtrados y Seguros
```

---

## Estructura del Repositorio

El proyecto sigue una organización estandarizada para facilitar la auditoría y el mantenimiento:

*   **`Documentacion/`**: Especificaciones técnicas, manuales de usuario y reportes de QA.
*   **`Gestion/`**: Planificación del proyecto, integrantes y reportes de avance.
*   **`Producto/`**: Código fuente del sistema (Monorepo Turborepo).

### Arquitectura del Sistema (Monorepo)

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
        A[Apps] --> B[admin-dashboard]
        A --> C[local-dashboard]
        A --> D[kitchen-kds]
        A --> E[waiter-terminal]
        A --> F[cashier-dashboard]
        A --> G[customer-portal]

        P[Packages Shared] --> UI["@menu-bites/ui"]
        P --> AUTH["@menu-bites/auth"]
        P --> STORE["@menu-bites/store"]

        Apps -.->|importa| Packages
    end
```

### Stack Tecnológico
*   **Frontend:** React 19, Next.js 15, TailwindCSS v4, Framer Motion.
*   **Backend & DB:** Supabase (PostgreSQL, Auth, Realtime, Storage).
*   **ORM:** Prisma.
*   **Monorepo:** Turborepo, npm Workspaces.
*   **Notificaciones:** Web Push API (VAPID).

---

## Configuración y Desarrollo

### Requisitos Previos
*   Node.js v20+
*   npm v10+
*   Instancia de Supabase configurada.

### Instalación

1. Clonar el repositorio:
   ```bash
   git clone <repository-url>
   cd Software-Restaurantes/Producto
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar variables de entorno:
   Copie el archivo `.env.example` a `.env` en la raíz de Producto y rellene las credenciales de Supabase.

4. Iniciar el entorno de desarrollo:
   ```bash
   npm run dev
   ```

### Scripts Disponibles
*   `npm run build`: Compila todas las aplicaciones para producción.
*   `npm run lint`: Ejecuta el análisis estático de código.
*   `npm run clean`: Limpia las cachés de build y node_modules.

---

## Seguridad y Privacidad
El sistema implementa **Row Level Security (RLS)** a nivel de base de datos, garantizando que cada restaurante solo pueda acceder a su propia información mediante tokens JWT validados por Supabase Auth.

---

## Notas de Versión
*   **v2.2.0 (Estable):** Refactorización arquitectónica modular. Sistema de alertas de asistencia en mesa, optimización de sonidos realtime y analítica avanzada de tiempos de cocina.
*   **v2.0 (Histórico):** Implementación completa de sincronización en tiempo real y flujo E2E.

---

Para una guía técnica detallada sobre la infraestructura y el motor de sincronización, consulte el archivo [TECHNICAL_SAD.md](Documentacion/TECHNICAL_SAD.md).

---
© 2026 Menu Bites Team. Todos los derechos reservados.
