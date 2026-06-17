# npm audit — Vulnerabilidades críticas (3)

## 1. vitest (y @vitest/coverage-v8)

- **Paquete:** `vitest` <=3.2.5, `@vitest/coverage-v8` <=3.2.5 (dependencia transitiva del mismo paquete).
- **CVE/GHSA:** [GHSA-5xrq-8626-4rwp](https://github.com/advisories/GHSA-5xrq-8626-4rwp)
- **Descripción:** Cuando el servidor UI de Vitest está escuchando, un atacante puede leer y ejecutar archivos arbitrarios.
- **CWE:** CWE-862 (Missing Authorization).
- **Impacto:** ejecución de código arbitrario / lectura de archivos si el UI server de Vitest queda expuesto (típicamente solo en desarrollo, no en producción).
- **Fix disponible:** sí, actualizar a `vitest@4.1.8` (cambio de major, `isSemVerMajor: true`).

## 2. shell-quote

- **Paquete:** `shell-quote` 1.1.0 - 1.8.3.
- **CVE/GHSA:** [GHSA-w7jw-789q-3m8p](https://github.com/advisories/GHSA-w7jw-789q-3m8p)
- **Descripción:** la función `quote()` no escapa saltos de línea en valores `.op`, permitiendo inyección de comandos si la salida se usa en un shell.
- **CWE:** CWE-77 (Command Injection), CWE-78 (OS Command Injection).
- **Impacto:** potencial inyección de comandos del sistema operativo si se usa `shell-quote` para construir comandos de shell con entrada no confiable.
- **Fix disponible:** sí (`npm audit fix` cubre esta dependencia transitiva).

## Riesgo real para Producto/

Ambas son **dependencias de desarrollo/build (devDependencies o sub-dependencias de tooling de testing/CLI)**, no se ejecutan en el runtime de las apps en producción. Riesgo principal: entorno de desarrollo y CI.
