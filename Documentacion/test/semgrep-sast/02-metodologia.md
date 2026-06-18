# Semgrep SAST — Metodología

## Comandos ejecutados

```bash
cd Producto/

# Tanda 1
semgrep scan \
  --config p/owasp-top-ten \
  --config p/javascript \
  --config p/typescript \
  --config p/react \
  --config p/sql-injection \
  --config p/secrets \
  --json --output Documentacion/test/semgrep-sast/raw-results.json

# Tanda 2
semgrep scan \
  --config p/security-audit \
  --config p/jwt \
  --config p/nextjs \
  --config p/expressjs \
  --config p/react-native \
  --json --output Documentacion/test/semgrep-sast/raw-results-2.json
```

## Cobertura

| Ruleset | Foco |
|---|---|
| p/owasp-top-ten | Top 10 OWASP genérico |
| p/javascript, p/typescript | Bugs y vulnerabilidades comunes JS/TS |
| p/react, p/react-native | XSS y patrones inseguros en componentes |
| p/sql-injection | Inyección SQL |
| p/secrets | Credenciales/API keys hardcodeadas |
| p/security-audit | Auditoría general de seguridad |
| p/jwt | Manejo inseguro de JWT |
| p/nextjs | Vulnerabilidades específicas Next.js (App Router, middleware, SSRF) |
| p/expressjs | Vulnerabilidades específicas Express |

Tanda 1: 117 reglas sobre 583 archivos. Tanda 2: 0 hallazgos, 2 errores de parseo (no bloqueantes, archivos individuales).

## Archivos de salida

- `raw-results.json` — resultado tanda 1 (JSON crudo de Semgrep).
- `raw-results-2.json` — resultado tanda 2 (JSON crudo de Semgrep).

## Limitaciones

- No se usó `--config auto` (requiere login/métricas habilitadas).
- Reglas community gratuitas; no incluye reglas Pro de Semgrep (lógica de negocio, taint cross-file profundo).
- No cubre configuración de infraestructura (Supabase RLS, políticas de Postgres, headers HTTP en producción).
