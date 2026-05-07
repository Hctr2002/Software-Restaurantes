# Manual Oficial de Integración Supabase — Sistema Menu Bites

**Orquestador:** Administrador del Sistema
**Versión:** 1.0 (Alineado con Menu Bites v2.3.0)
**Sistema:** Supabase (Database, Auth, Storage, Edge Functions)
**Objetivo:** Establecer el procedimiento inquebrantable para la gestión y seguridad de Supabase, integrando las nuevas herramientas especializadas en el ciclo de vida del desarrollo.

---

## 1. Fundamentos de la Integración Supabase

El sistema **Menu Bites** depende críticamente de Supabase para la persistencia multi-tenant y la autenticación. La integración se rige por:

- **RLS (Row Level Security)**: Es el corazón de la arquitectura multi-tenant. Ninguna consulta debe ejecutarse sin una política RLS activa que valide el `restaurant_id`.
- **Prisma + Supabase**: El ORM gestiona las migraciones, pero Supabase garantiza la integridad física y la seguridad en la capa de datos.

---

## 2. El Pipeline de Calidad Supabase

Las nuevas herramientas se inyectan en los workflows para garantizar una base de datos de "Grado Producción".

### Fase 1: `Validación de Calidad` (Optimización Postgres)
- **Tier 1 (Estático)**: La herramienta **`supabase-postgres-best-practices`** audita los esquemas de Prisma y SQL. Se verifican índices faltantes, tipos de datos ineficientes y se aplican las 8 categorías de optimización de Supabase.
- **Tier 3 (Semántico)**: Validación semántica de las políticas RLS para asegurar que el aislamiento entre restaurantes sea hermético.

### Fase 2: `/security-audit` (Blindaje de Datos)
- Se utiliza la herramienta **`supabase`** para realizar auditorías de seguridad en la configuración de Auth y Storage.
- Verificación de JWT, expiración de sesiones y permisos de buckets para evitar fugas de información.

### Fase 3: `Revisión Técnica` (Revisión de Arquitectura)
- Los revisores utilizan las guías de Supabase para asegurar que las Edge Functions estén optimizadas y que el uso de `supabase-js` o `@supabase/ssr` siga los patrones recomendados para Next.js.

---

## 3. Operaciones Especializadas con Herramientas

### Auditoría de Rendimiento Postgres
Para optimizar una consulta lenta o revisar el esquema:
1. Invocar al agente con: *"Revisa mi esquema de base de datos usando las mejores prácticas de Supabase"*.
2. El agente activará la herramienta `supabase-postgres-best-practices` y generará un reporte de hallazgos categorizado por impacto (Crítico, Alto, Medio, Bajo).

### Gestión de Auth y Migraciones
1. Para configurar nuevos flujos de Auth (ej. OTP, Social Login): El agente consultará la herramienta `supabase` para obtener la implementación exacta compatible con `@supabase/ssr`.
2. Las migraciones deben ser validadas contra el esquema local antes de ser aplicadas a producción.

---

## 4. Resolución de Conflictos y Errores Comunes

- **Error de RLS**: Si una consulta devuelve un array vacío inesperadamente, el flujo `/security-audit` debe verificar si el `restaurant_id` está siendo correctamente inyectado en el contexto de la sesión.
- **Connection Pooling**: En entornos serverless (Vercel), el manual dicta el uso obligatorio del Transaction Mode en el pooler de Supabase para evitar el agotamiento de conexiones.

**Fin del documento.**
*Documentación del proyecto consolidada.*
