# Revisión de archivos .env / secretos expuestos

**Tipo de prueba:** búsqueda manual de credenciales/secretos en archivos versionados.
**Comando:** `find . -maxdepth 4 -iname "*.env*" -not -path "./node_modules/*"`
**Fecha:** 2026-06-10.

## Archivos encontrados

- `Producto/.env.example`
- `Producto/apps/cashier-dashboard/.env.example`
- `Producto/apps/local-dashboard/.env.example`

## Resultado

**Sin secretos reales expuestos.** Los 3 archivos son plantillas (`.env.example`) con placeholders:

- `NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"`
- `SUPABASE_SERVICE_ROLE_KEY=tu_secret_key_completa_aqui`
- `VAPID_PRIVATE_KEY="xxx...tu-clave-privada..."`
- `DATABASE_URL="postgresql://postgres.xxxx:password@..."` (placeholder con `xxxx`/`password` literales)

No existe `.env` real versionado. `.gitignore` cubre `node_modules/` correctamente; no se verificó explícitamente regla para `.env` (recomendado confirmar que `.env`, `.env.local`, `supabase/.env` estén ignorados).

## Recomendación

- Confirmar en `.gitignore` reglas explícitas para `.env`, `.env.local`, `*.env` (no solo `.env.example`).
- El archivo raíz `.env.example` mezcla variables de **frontend** (`NEXT_PUBLIC_*`, expuestas al navegador) con secretos de **backend** (`SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`, `DATABASE_URL`) en un mismo archivo de ejemplo. Asegurar que en los `.env` reales estos valores backend nunca se carguen en builds de cliente (Next.js solo expone `NEXT_PUBLIC_*` al bundle, pero conviene separar archivos para reducir riesgo de error humano).
