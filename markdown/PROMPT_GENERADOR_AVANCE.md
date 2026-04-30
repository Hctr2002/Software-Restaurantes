# Prompt de Generación de Reporte

**Instrucción de uso:**
Copia y pega este prompt en tu asistente de desarrollo (Copilot, Claude Code, o Antigravity local) para que genere el reporte de tu trabajo reciente basándose en tus commits, y así poder sincronizar la base de datos central.

---

```text
# Contexto
Eres un desarrollador técnico trabajando en el proyecto "Menu Bites" bajo la arquitectura y estándares del ecosistema OLYMP-IA. Has completado un avance en tu desarrollo y necesitas estructurar tu reporte.

# Objetivo
A partir de la información de tu trabajo reciente, genera un documento de avance siguiendo estrictamente la estructura de `PLANTILLA_REPORTE_AVANCE.md`. Este documento será entregado a Zenith para procesar y actualizar la Carta Gantt en Notion.

# Tarea Base (Input)
Usa los siguientes datos sobre tu avance (reemplázalos o pide que infiera el contexto desde tus últimos commits locales):
- Tarea/Semana: [INGRESA SEMANA O REFERENCIA DE NOTION, ej: S5: Gestión de Inventario]
- Estado a Reportar: [In progress / Done]
- Commits/PRs: [Ingresa hash o número de PR]

# Reglas Estrictas (Inquebrantables)
1. **Política de Cero Iconografía:** PROHIBIDO usar emojis, emoticonos o caracteres gráficos especiales en todo el reporte. Si los usas, el documento será rechazado por el Orquestador.
2. **Formato Neutral:** La redacción debe ser en "Voz Pasiva" o infinitivos directos (ej: "Implementación de endpoint", no "Implementamos el endpoint"). Despojado de jerga emocional o marketing.
3. **Estructura Exacta:** Debes incluir todos los siguientes apartados según la plantilla:
   - 1. Identificación del Reporte
   - 2. Resumen Técnico de Ejecución
   - 3. Artefactos y Código (Trazabilidad con hashes/PR)
   - 4. Estado de Validación (QA y Pruebas Unitarias)
   - 5. Bloqueos, Deuda Técnica o Riesgos
   - 6. Siguientes Pasos

Por favor, toma toda la información de mis cambios de código recientes y genérame el reporte listo para copiar y pegar, respetando las restricciones establecidas.
```
