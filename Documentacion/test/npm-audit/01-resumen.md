# npm audit — Resumen

**Tipo de prueba:** Análisis de composición de software (SCA) — vulnerabilidades conocidas (CVE/GHSA) en dependencias.
**Herramienta:** `npm audit` (npm 10.2.4).
**Alcance:** `Producto/package-lock.json` (monorepo, 1906 dependencias totales: 954 prod, 876 dev, 176 optional, 9 peer).
**Fecha:** 2026-06-10.

## Resultado global

| Severidad | Cantidad |
|---|---|
| Crítica | 3 |
| Alta | 3 |
| Moderada | 23 |
| Baja | 0 |
| Info | 0 |
| **Total** | **29** |

## Detalle por severidad

- [Vulnerabilidades críticas](03-criticos.md) — vitest, vitest/coverage-v8, shell-quote.
- [Vulnerabilidades altas](04-altos.md) — next, nx, tmp.
- [Vulnerabilidades moderadas](05-moderados.md) — 23 paquetes (expo*, vite, ws, yaml, follow-redirects, etc.).
- [Plan de remediación](06-plan-remediacion.md).

Metodología en [02-metodologia.md](02-metodologia.md).
