# Shannon y Raptor — motivo de no ejecución

## Shannon (KeygraphHQ/shannon)

Repositorio clonado en `/tmp/sectools/shannon` para inspección.

**Qué es:** pentester autónomo basado en IA (white-box), ejecuta exploits reales contra una app en ejecución.

**Requisitos para correr:**
- Docker (worker container).
- Node.js 18+.
- Credenciales de proveedor de IA (Anthropic API key u otro), facturadas por separado.
- URL de la aplicación objetivo corriendo (`shannon start -u <url> -r <repo>`).

**Motivo de no ejecución:** requiere levantar la app completa (monorepo Next.js + Supabase) y proveer una API key de IA propia, además de ejecutar exploits reales contra el entorno. Se decidió no ejecutar sin esa configuración explícita del usuario.

## Raptor (gadievron/raptor)

Repositorio clonado en `/tmp/sectools/raptor` para inspección.

**Qué es:** framework de investigación ofensiva/defensiva construido sobre Claude Code, combina análisis estático (Semgrep, CodeQL), análisis binario y validación/explotación asistida por LLM.

**Requisitos para correr:**
- Claude Code instalado (`@anthropic-ai/claude-code`), agente de IA separado.
- Semgrep y CodeQL.
- API key de IA para la capa agéntica.

**Motivo de no ejecución:** la capa agéntica de Raptor requiere su propia instancia de Claude Code y créditos de API. Se aprovechó únicamente el componente no agéntico equivalente (Semgrep) directamente contra el código, documentado en [semgrep-sast/](semgrep-sast/01-resumen.md).

## Alternativa ejecutada

Se corrieron las partes de estas suites que no requieren agentes de IA ni credenciales adicionales:
- Semgrep (SAST) con reglas OWASP/JS/TS/React/SQLi/secrets/security-audit/JWT/Next.js/Express/React Native.
- `npm audit` sobre el lockfile del monorepo.
- Revisión manual de archivos `.env.example` por secretos expuestos.
