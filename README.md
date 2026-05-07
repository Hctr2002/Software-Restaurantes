# Menu Bites - Plataforma Multitenant de Gestión Gastronómica

![Branding](Documentacion/01_Documentacion/Diagramas/img/arquitectura.png)

## Descripción del Proyecto
**Menu Bites** es una solución integral diseñada para revolucionar la gestión de restaurantes mediante la digitalización de procesos y la operación en tiempo real. Basado en una arquitectura multitenant, permite a múltiples establecimientos gestionar su ecosistema operativo de forma aislada, segura y escalable.

El proyecto se compone de dos frentes principales:
1.  **Forkit Web**: Suite administrativa y operativa basada en Next.js 14.
2.  **Forkit Mobile**: Aplicación móvil para clientes y garzones basada en React Native & Expo.

## Arquitectura Técnica
- **Frontend**: Monorepo Next.js + Tailwind CSS + Shadcn/UI.
- **Mobile**: React Native + Expo (Android/iOS).
- **Backend**: Supabase (PostgreSQL, Realtime, Auth, Storage).
- **Seguridad**: Row Level Security (RLS) basado en JWT Claims para aislamiento de datos.

## Estructura del Repositorio
- `Documentacion/`: Todo el material técnico, informes, SAD y manuales (PDF/DOCX/MD).
- `Producto/apps/`: Aplicaciones operativas (Admin, Kitchen, Waiter, Cashier, Customer).
- `Gestion/`: Planificación y activos del proyecto.

## Instalación y Desarrollo
Para iniciar el ecosistema completo localmente:

```bash
# Instalar dependencias
npm install

# Iniciar servicios operativos (Ports 3000-3005)
npm run dev:all
```

## Estado del Proyecto
Actualmente en **Fase 2 (S8)**: Ejecución Real-time. El ecosistema base está certificado y validado contra la planificación estratégica.

---
Desarrollado para el ecosistema Menu Bites
