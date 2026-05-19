# Documentación Técnica — Menu Bites

Índice navegable de todos los documentos técnicos del sistema. Cada documento tiene un propósito específico y diferenciado.

---

## Documentos Disponibles

### Documentación Técnica

| Documento | Propósito | Audiencia Principal |
|---|---|---|
| [TECHNICAL_SAD.md](TECHNICAL_SAD.md) | Arquitectura de software, stack tecnológico, flujos de datos | Arquitectos, desarrolladores |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | ERDs por dominio, diccionario de datos completo | Desarrolladores, analistas |
| [DATABASE_TECHNICAL.md](DATABASE_TECHNICAL.md) | RLS policies, roles de BD, índices, migraciones | Backend, DevOps |
| [API_SPECIFICATION.md](API_SPECIFICATION.md) | Endpoints de todas las apps, payloads, respuestas | Desarrolladores frontend/backend |
| [SECURITY_POSTURE.md](SECURITY_POSTURE.md) | Capas de seguridad, RBAC, gestión de secretos | Security engineers |
| [USER_MANUAL.md](USER_MANUAL.md) | Manual de uso de cada aplicación con flujos | Usuarios finales, QA |
| [TEST_PLAN.md](TEST_PLAN.md) | Estrategia QA, criterios PASS/FAIL | QA engineers, tech leads |
| [SUGGESTED_TESTS.md](SUGGESTED_TESTS.md) | Casos de prueba detallados por ID y módulo | QA engineers |
| [MANUAL_DEPLOY_VERCEL.md](MANUAL_DEPLOY_VERCEL.md) | Instrucciones paso a paso para deployment en Vercel | DevOps, QA |
| [onboarding_manager.md](onboarding_manager.md) | Guía metodológica para configuración inicial de restaurantes | Gerentes, implementadores |
| [CAMBIOS_REVIEW_FRONT_BAR.md](CAMBIOS_REVIEW_FRONT_BAR.md) | Historial de cambios UI en el panel de Bar | Desarrolladores frontend |

### Históricos y Actas

| Documento | Propósito |
|---|---|
| [verificacion_entrega_1.md](verificacion_entrega_1.md) | Auditoría de cumplimiento vs Requerimientos Iniciales |
| [mockups_wireframes_aprobacion.md](mockups_wireframes_aprobacion.md) | Acta de aprobación formal de diseño |

### Entregables Académicos — [01_Documentacion/](01_Documentacion/)

| Documento | Formato |
|---|---|
| [4.1_Requerimientos.pdf](01_Documentacion/4.1_Requerimientos.pdf) | Especificación de requerimientos funcionales y no funcionales |
| [4.2_Mockups.pdf](01_Documentacion/4.2_Mockups.pdf) | Wireframes y diseño de interfaces |
| [4.3_Arquitectura.pdf](01_Documentacion/4.3_Arquitectura.pdf) | Documento de arquitectura del sistema |
| [6.3_Gantt.pdf](01_Documentacion/6.3_Gantt.pdf) | Cronograma del proyecto |
| [Informe_EP2.pdf](01_Documentacion/Informe_EP2.pdf) | Informe de entrega parcial 2 |
| [Manual_Usuario.pdf](01_Documentacion/Manual_Usuario.pdf) | Manual de usuario (versión entrega) |
| [Manual_Despliegue.pdf](01_Documentacion/Manual_Despliegue.pdf) | Manual de despliegue (versión entrega) |
| [Manual_Base_Datos.pdf](01_Documentacion/Manual_Base_Datos.pdf) | Manual de base de datos (versión entrega) |
| [Diagramas/DIAGRAMA_CLASES.pdf](01_Documentacion/Diagramas/DIAGRAMA_CLASES.pdf) | Diagrama de clases |
| [Diagramas/DIAGRAMA_ERD.pdf](01_Documentacion/Diagramas/DIAGRAMA_ERD.pdf) | Diagrama entidad-relación |

### Diagramas Auto-generados — [diagrams/](diagrams/)

Visualizaciones SVG generadas desde los bloques Mermaid de los documentos técnicos. Ver [diagrams/index.html](diagrams/index.html) para exploración interactiva. No editar manualmente.

---

## Guía de Lectura por Rol

**Nuevo desarrollador incorporándose al proyecto:**
1. [TECHNICAL_SAD.md](TECHNICAL_SAD.md) — entender la arquitectura general
2. [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) — entender el modelo de datos
3. [DATABASE_TECHNICAL.md](DATABASE_TECHNICAL.md) — entender RLS y patrones de acceso
4. [API_SPECIFICATION.md](API_SPECIFICATION.md) — entender los endpoints disponibles

**QA Engineer:**
1. [USER_MANUAL.md](USER_MANUAL.md) — entender los flujos de usuario
2. [TEST_PLAN.md](TEST_PLAN.md) — leer la estrategia y criterios de release
3. [SUGGESTED_TESTS.md](SUGGESTED_TESTS.md) — ejecutar casos de prueba por ID

**Revisor de seguridad o auditor:**
1. [SECURITY_POSTURE.md](SECURITY_POSTURE.md) — arquitectura de defensa en profundidad
2. [DATABASE_TECHNICAL.md](DATABASE_TECHNICAL.md) — políticas RLS y roles de BD

**Product Manager o Stakeholder:**
1. [USER_MANUAL.md](USER_MANUAL.md) — funcionalidades por aplicación y rol

---

## Estado del Sistema

| Versión | Fecha | Cambios principales |
|---|---|---|
| v2.6.0 | 2026-05-17 | App mobile React Native / Expo marcada como completa; sección 7.15 del SAD con arquitectura, roles, autenticación, funcionalidades nativas y estructura; README propio de la app mobile |
| v2.5.0 | 2026-05-17 | Documentación JSDoc en español en todos los archivos TypeScript del monorepo (~280 archivos); estándar de cabeceras de archivo, JSDoc de funciones/hooks/componentes, comentarios de sección y comentarios inline; paquetes `@menu-bites/auth`, `@menu-bites/ui` y `@menu-bites/store` completamente documentados |
| v2.4.0 | 2026-05-10 | Bar Dashboard (rol BAR, puerto 3006); arquitectura dual-estación KITCHEN/BAR; campo `target_station` en categorías; `kds_settings` polimórfico; `bar_ready`/`bar_preparing` en órdenes |
| v2.3.0 | anterior | Refactor UX/UI Pro Max; flujo de pedido automatizado; motor de marca dinámica |
| v2.0.0 | anterior | Monorepo multitenant completo; RLS; Realtime; Web Push |

---

## Fuente de Verdad

El archivo `Producto/supabase/prisma/schema.prisma` es la fuente de verdad absoluta para tipos, nombres de campos y relaciones. Ante cualquier discrepancia entre este índice y el schema, el schema prevalece.
