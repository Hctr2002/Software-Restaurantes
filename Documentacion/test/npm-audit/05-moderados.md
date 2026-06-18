# npm audit — Vulnerabilidades moderadas (23)

## Grupo Expo / React Native (apps/mobile)

`@expo/cli`, `@expo/config`, `@expo/config-plugins`, `@expo/metro-config`, `@expo/prebuild-config`, `expo`, `expo-asset`, `expo-constants`, `expo-linking`, `expo-notifications`, `expo-router`, `expo-splash-screen`, `xcode`.

- Cadena de dependencias transitivas del SDK de Expo usado en `apps/mobile`.
- Sin advisories individuales con título propio en el reporte (vulnerabilidades heredadas de sub-dependencias del propio Expo CLI/toolchain).
- **Impacto:** afecta tooling de build/dev de la app móvil, no el bundle final necesariamente.

## Grupo Vite / Vitest (testing/build)

- **vite** — [GHSA path traversal en manejo de `.map` de deps optimizadas]. CWE path traversal.
- **vite-node**, **@vitest/mocker** — sub-dependencias del mismo ecosistema de testing.

**Impacto:** entorno de desarrollo/test, no producción.

## brace-expansion

- **GHSA:** "Zero-step sequence causes process hang and memory exhaustion" + "Large numeric range defeats documented `max` DoS protection".
- **Impacto:** DoS (hang/memory exhaustion) si se procesan patrones glob con input no confiable. Dependencia transitiva muy común (usada por minimatch/glob en casi todo el toolchain).

## esbuild

- **GHSA:** "esbuild enables any website to send any requests to the development server and read the response".
- **Impacto:** únicamente afecta el dev server de esbuild (usado por Vite) — riesgo en desarrollo, no en build de producción.

## follow-redirects

- **GHSA:** "leaks Custom Authentication Headers to Cross-Domain Redirect Targets".
- **Impacto:** si alguna llamada HTTP del backend (axios u otro cliente basado en follow-redirects) sigue redirects cross-domain con headers de auth custom, podrían filtrarse credenciales al destino del redirect.

## turbo

- **GHSA:** "Login callback CSRF/session fixation" + "Unexpected local code execution during Yarn Berry detection".
- **Impacto:** herramienta de build del monorepo (devDependency). Riesgo en CI/entorno de desarrollo.

## uuid

- **GHSA:** "Missing buffer bounds check in v3/v5/v6 when buf is provided".
- **Impacto:** bajo si no se usa la API de buffer externo de `uuid` v3/v5/v6 directamente.

## yaml

- **GHSA:** "Stack Overflow via deeply nested YAML collections".
- **Impacto:** DoS si se parsea YAML de fuente no confiable con entrada profundamente anidada.

## ws

- **GHSA:** "Uninitialized memory disclosure".
- **Impacto:** dependencia de WebSocket — relevante porque `waiter-terminal` usa Web Push/VAPID y posiblemente WebSockets. Verificar si `ws` está en el path de runtime o solo en tooling.
