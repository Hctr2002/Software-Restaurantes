# npm audit — Metodología

## Comando ejecutado

```bash
cd Producto/
npm audit --json > Documentacion/test/npm-audit/raw-results.json
npm audit fix --dry-run --json > Documentacion/test/npm-audit/fix-dry-run.json
```

## Cómo funciona

`npm audit` lee `package-lock.json` y consulta la base de datos de advisories de GitHub (GHSA) sin necesidad de instalar `node_modules`. No ejecuta código, no requiere red hacia la app objetivo, no requiere API keys de IA.

## Archivos de salida

- `raw-results.json` — reporte completo en JSON (29 vulnerabilidades, metadata de dependencias).
- `fix-dry-run.json` — simulación de `npm audit fix` (qué se resolvería sin aplicar cambios).

## Limitaciones

- No se hizo `npm install`: no se valida si las vulnerabilidades son alcanzables en runtime real (algunas son devDependencies/build-only).
- No cubre vulnerabilidades en código propio (ver [semgrep-sast](../semgrep-sast/01-resumen.md)) ni en dependencias de Supabase Edge Functions (Deno, no usa npm).
- Las severidades "alta"/"crítica" agregadas por npm reflejan el peor advisory por paquete; un paquete puede tener advisories de menor severidad agrupados.
