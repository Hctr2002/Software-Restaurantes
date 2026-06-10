# npm audit — Vulnerabilidades altas (3)

## 1. next (16.0.0 - 16.2.5)

Paquete de **producción** (framework de las apps Next.js: admin-dashboard, customer-portal, etc.). 13 advisories agrupados bajo este paquete, los de severidad alta:

| GHSA | Título | CWE |
|---|---|---|
| [GHSA-8h8q-6873-q5fj](https://github.com/advisories/GHSA-8h8q-6873-q5fj) | DoS con Server Components | CWE-770 |
| [GHSA-26hh-7cqf-hhc6](https://github.com/advisories/GHSA-26hh-7cqf-hhc6) | Middleware/Proxy bypass via segment-prefetch routes (fix incompleto) | CWE-288 |
| [GHSA-mg66-mrh9-m8jx](https://github.com/advisories/GHSA-mg66-mrh9-m8jx) | DoS por agotamiento de conexiones (Cache Components) | CWE-770 |
| [GHSA-c4j6-fc7j-m34r](https://github.com/advisories/GHSA-c4j6-fc7j-m34r) | SSRF via WebSocket upgrades | CWE-918 |
| [GHSA-492v-c6pp-mqqv](https://github.com/advisories/GHSA-492v-c6pp-mqqv) | Middleware/Proxy bypass via dynamic route parameter injection | CWE-288 |
| [GHSA-267c-6grr-h53f](https://github.com/advisories/GHSA-267c-6grr-h53f) | Middleware/Proxy bypass via segment-prefetch routes | CWE-288 |
| [GHSA-36qx-fr4f-26g5](https://github.com/advisories/GHSA-36qx-fr4f-26g5) | Middleware/Proxy bypass en Pages Router con i18n | CWE-863 |

(Más 6 advisories moderate/low del mismo paquete: XSS via CSP nonces, XSS en beforeInteractive scripts, cache poisoning, DoS en Image Optimization API, redirects cache-poisoned.)

- **Impacto:** los bypass de Middleware/Proxy son los más relevantes — pueden permitir saltarse lógica de autenticación/autorización implementada en `middleware.ts` (relevante porque `admin-dashboard` actúa como gateway de auth centralizado, ver `.env.example`: `NEXT_PUBLIC_AUTH_URL`).
- **Fix disponible:** sí — actualizar `next` a versión >=16.2.6 (parche, no major según rango reportado).

## 2. nx

- **Paquete:** `nx` (rangos beta/inestables: 10.0.7-beta.x, 22.7.0-beta.0 - 22.7.4, >=23.0.0-beta.0).
- **Impacto:** herramienta de build/monorepo (devDependency vía turbo/lerna toolchain). No afecta runtime de producción.
- **Fix disponible:** sí.

## 3. tmp

- **Paquete:** `tmp` <0.2.6.
- **CVE/GHSA:** [GHSA-ph9p-34f9-6g65](https://github.com/advisories/GHSA-ph9p-34f9-6g65)
- **Descripción:** Path Traversal vía prefix/postfix sin sanear, permite escapar del directorio temporal.
- **CWE:** CWE-22.
- **Impacto:** dependencia transitiva de tooling (build/CLI). Riesgo principal en build/CI si se usan inputs no confiables para nombres de archivos temporales.
- **Fix disponible:** sí.
