# npm audit — Plan de remediación

## Prioridad 1 (producción, alta severidad)

- **next** (16.0.0-16.2.5 → >=16.2.6): actualizar en todas las apps Next.js (admin-dashboard, customer-portal, kitchen-kds, bar-dashboard, waiter-terminal, cashier-dashboard, local-dashboard). Fix no-major según `npm audit`. Probar especialmente rutas de `middleware.ts` (auth gateway) tras actualizar, dado que varios CVEs son bypass de middleware.

## Prioridad 2 (cadena de testing/build — críticos pero no runtime)

- **vitest / @vitest/coverage-v8**: actualizar a v4.1.8 (major). Requiere revisar breaking changes de Vitest 4 antes de actualizar (config, API de coverage).
- **shell-quote, tmp, nx**: cubiertos por `npm audit fix` automático (no major).

## Prioridad 3 (moderados, mayormente dev/tooling)

- Ejecutar `npm audit fix` para resolver automáticamente lo que no requiera bump major (`brace-expansion`, `follow-redirects`, `ws`, `yaml`, `uuid`, `vite`, `turbo`).
- Grupo Expo (`apps/mobile`): actualizar Expo SDK a versión que resuelva las sub-dependencias listadas; revisar changelog de Expo para breaking changes en RN.

## Comando de verificación rápida

```bash
cd Producto/
npm audit fix          # aplica fixes sin bump major
npm audit               # confirma reducción de hallazgos
npm audit fix --force   # solo si se acepta riesgo de breaking changes (vitest 4, expo)
```

## Nota

No se ejecutó `npm install` ni `npm audit fix` sobre el repositorio — esta auditoría es de solo lectura sobre `package-lock.json`. Cualquier cambio de dependencias debe aplicarse y probarse (build + tests + e2e) antes de mergear.
