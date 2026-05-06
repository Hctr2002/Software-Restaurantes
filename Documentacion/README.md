# Documentación Técnica — Menu Bites

Índice navegable de todos los documentos técnicos del sistema. Cada documento tiene un propósito específico y diferenciado.

---

## Documentos Disponibles

| Documento | Propósito | Audiencia Principal |
|---|---|---|
| [TECHNICAL_SAD.md](TECHNICAL_SAD.md) | Arquitectura de software, stack tecnológico, flujos de datos, despliegue en Vercel | Arquitectos, desarrolladores senior |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | ERDs por dominio, diccionario de datos completo, enums, constraints | Desarrolladores, analistas de datos |
| [DATABASE_TECHNICAL.md](DATABASE_TECHNICAL.md) | RLS policies en SQL, roles de BD, índices, patrones de acceso, migraciones | Backend developers, DevOps |
| [API_SPECIFICATION.md](API_SPECIFICATION.md) | Endpoints de todas las apps, payloads, respuestas, códigos HTTP | Desarrolladores frontend y backend |
| [SECURITY_POSTURE.md](SECURITY_POSTURE.md) | Capas de seguridad, RBAC, gestión de secretos, protección contra ataques | Security engineers, revisores de PR |
| [USER_MANUAL.md](USER_MANUAL.md) | Manual de uso de cada aplicación con flujos y diagramas | Product managers, QA, stakeholders |
| [TEST_PLAN.md](TEST_PLAN.md) | Estrategia QA, pirámide de pruebas, criterios PASS/FAIL, checklist pre-release | QA engineers, tech leads |
| [SUGGESTED_TESTS.md](SUGGESTED_TESTS.md) | Catálogo detallado de casos de prueba con criterios de aceptación por ID | QA engineers, desarrolladores |

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

## Fuente de Verdad

El archivo `Producto/supabase/prisma/schema.prisma` es la fuente de verdad absoluta para tipos, nombres de campos y relaciones. Ante cualquier discrepancia entre este índice y el schema, el schema prevalece.
