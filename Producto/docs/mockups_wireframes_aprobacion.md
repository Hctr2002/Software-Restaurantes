# Acta de Aprobacion de Mockups y Wireframes

Documento de aprobacion formal para el flujo de autenticacion y pantallas core de operacion.

## 1. Identificacion

- Proyecto: Menu Bites
- Fecha de revision: 2026-04-11
- Alcance: Login, Recuperacion de contrasena, Reset de contrasena, Dashboard inicial
- Responsables de revision: Product Owner, UX Lead, Tech Lead, Gerencia de Cuenta

## 2. Artefactos Evaluados

- Login centralizado (Admin Dashboard)
- Flujo de "Olvide mis credenciales"
- Flujo de recuperacion por correo y reset de contrasena
- Vistas de acceso de Kitchen KDS y Waiter Terminal

## 3. Metricas Esteticas Corporativas (Wow Factor)

La aprobacion se considera valida cuando cada metrica cumple umbral minimo y no presenta observaciones criticas.

- Claridad visual de jerarquia: minimo 8.5/10
- Consistencia de marca (tipografia, color, tono): minimo 9.0/10
- Percepcion premium de interfaz: minimo 8.5/10
- Legibilidad en condiciones de alto trafico operacional: minimo 9.0/10
- Tiempo promedio de reconocimiento de accion primaria (CTA): maximo 1.8 segundos
- Friccion percibida del flujo de login (encuesta de 5 puntos): maximo 2.0

## 4. Restricciones Obligatorias de Aprobacion

- Politica de Cero Iconografia para reportes y manuales operativos.
- Mensajes de error estandarizados y auditables.
- Compatibilidad responsive minima: resoluciones moviles y escritorio.
- Sin bloqueo de flujo por animaciones o efectos visuales.

## 5. Resultado de Revision

- Estado: APROBADO CONDICIONAL
- Condicion 1: Mantener trazabilidad de cambios de UI con versionado por hito.
- Condicion 2: Revalidar wow factor en cada release con cambios visuales mayores.

## 6. Evidencia y Trazabilidad

- Referencia de manual de onboarding: docs/onboarding_manager.md
- Referencia de login: apps/admin-dashboard/src/app/page.tsx
- Referencia de recuperacion: apps/admin-dashboard/src/app/forgot-password/page.tsx
- Referencia de reset: apps/admin-dashboard/src/app/reset-password/page.tsx
