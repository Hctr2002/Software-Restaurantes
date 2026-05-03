# Manual Oficial de Despliegue Vercel — Ecosistema OLYMP-IA

**Orquestador:** Swarm Zenith (00)
**Versión:** 1.0 (Alineado con OLYMP-IA v2.3.0)
**Arquitectura:** Monorepo (Turbo) Multi-Tenant por Slug
**Objetivo:** Establecer el procedimiento inquebrantable para el despliegue a producción en Vercel, integrando las validaciones estéticas, de código y de seguridad obligatorias de la Constitución.

---

## 1. Fundamentos Arquitectónicos del Despliegue Multi-Tenant

El sistema **Menu Bites** utiliza un enrutamiento multi-tenant basado en la URL (`/[slug]/dashboard/...`). Al desplegar en Vercel, este patrón aprovecha las siguientes características de la plataforma:

- **Middleware Edge**: El archivo `proxy.ts` (middleware de Next.js) se ejecuta en la Edge Network de Vercel antes de que la petición toque los servidores de Node.js, validando instantáneamente el `restaurant_id` del token JWT contra el `slug` de la URL.
- **Serverless Functions**: Las rutas de la API (ej. `api/local/menu`) se compilan como funciones Serverless independientes, garantizando aislamiento de memoria y escalabilidad bajo alta demanda.

---

## 2. El Pipeline Gated de OLYMP-IA

Todo despliegue a producción requiere la ejecución secuencial e inquebrantable de tres workflows globales. Ningún paso puede saltarse.

### Fase 1: `/quality_validation` (Validación de Alta Resolución)
Antes de siquiera solicitar un PR, el código local debe someterse a esta capa.
- **Tier 1 (Estático)**: Utiliza la skill **`vercel-react-best-practices`** para auditar el código de React/Next.js. Se verifica la eliminación de cascadas de renderizado (waterfalls), optimización del tamaño del bundle y rendimiento en el servidor.
- **Tier 2 (Funcional)**: Se ejecutan pruebas de resiliencia de la interfaz.
- **Tier 3 (Semántico)**: La skill **`web-design-guidelines`** escanea el DOM en busca de violaciones a la accesibilidad (a11y), contrastes y animaciones fluidas, garantizando el "Wow Factor" exigido.

### Fase 2: `/qa-review` (Revisión de Pares y Seguridad)
Una vez superada la calidad local, el código se sube al PR.
- El Swarm de QA audita la arquitectura utilizando la skill **`vercel-composition-patterns`**, asegurando que los componentes no abusen de las *boolean props* y estén estructurados para escalar en el ecosistema multi-tenant.
- Se asegura que los contratos técnicos y las rutas proxy no tengan brechas de seguridad.

### Fase 3: `/deploy-prod` (Lanzamiento a Vercel)
La culminación de la cadena de valor. Este flujo delega la orquestación de la infraestructura a las skills automatizadas.
- Se utiliza la skill **`vercel-cli-with-tokens`** para gestionar el acceso seguro a los equipos de Vercel.
- Se ejecuta la skill **`deploy-to-vercel`** para empaquetar, detectar automáticamente los frameworks dentro del monorepo y enviar el código a los servidores de despliegue.

---

## 3. Instrucciones Paso a Paso para el Despliegue

### Opción A: Despliegue Total vía CI/CD (Recomendado)
Esta es la ruta "Zero Touch" que impone OLYMP-IA para producción.

1. Finalizar la rama `feature/*` asegurando que todos los conflictos estén resueltos.
2. Ejecutar localmente el mandato `/quality_validation`. Resolver cualquier advertencia generada por las guías de diseño de Vercel.
3. Subir los cambios a GitHub y abrir un Pull Request hacia `develop` o `main`.
4. El webhook activará el flujo `/qa-review` en la nube.
5. Al aprobarse (y tras el merge), se dispara el workflow `/deploy-prod`. Vercel detectará el *push* a la rama principal y construirá todas las aplicaciones del workspace (ej. `local-dashboard`, `customer-portal`) mapeándolas a sus respectivos dominios.

### Opción B: Despliegue Agentic Manual (Terminal OLYMP-IA)
Útil para despliegues de prueba (`Preview Environments`) directamente gestionados por el agente.

1. **Contextualización**: Solicitar al agente: *"Ejecuta un despliegue de prueba del módulo `local-dashboard`"*
2. **Ejecución de la Skill**: El agente detectará la intención y utilizará la skill `deploy-to-vercel`.
3. **Mecanismo No-Auth**:
   - Si no hay sesión iniciada de Vercel CLI en la terminal, la skill empaquetará el directorio del proyecto y lo enviará mediante el **Fallback No-Auth**.
   - El agente devolverá instantáneamente dos enlaces:
     - **Preview URL**: Enlace funcional inmediato para probar el multi-tenant (`https://...vercel.app/[slug]/...`).
     - **Claim URL**: Enlace de un solo uso para que el Humano reclame el proyecto y lo asocie permanentemente a su cuenta corporativa o equipo en Vercel.

---

## 4. Política de Resolución de Incidentes (Post-Deploy)

- Si Vercel reporta fallos por *Memory Out of Bounds* (común en despliegues pesados de Prisma): La arquitectura dicta revisar la conexión de base de datos a `pgbouncer` y usar la versión de Prisma adaptada a Serverless/Edge.
- Si hay errores en las transiciones de páginas en la aplicación del consumidor: Usar la skill `vercel-react-view-transitions` introducida en esta iteración para pulir la UX del flujo `customer-portal`.

**Fin del Sello.**
*Memoria institucional consolidada.*
