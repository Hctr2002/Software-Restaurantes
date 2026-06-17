# Performance — Carga, Estrés, Escalabilidad y Rendimiento (k6)

Suite de pruebas de rendimiento con [**k6**](https://k6.io) (escrita en TypeScript)
para asegurar que la API se comporta bien bajo carga. Hoy apunta al endpoint más
crítico del producto: la **creación de pedidos** del `customer-portal`
(`POST /api/orders`), el camino más pesado (~5 queries secuenciales + split por
estación + trigger Realtime), más sus rutas de lectura y de mesa.

## Escenarios

| Script | Tipo | Qué responde | Duración |
|--------|------|--------------|----------|
| `k6/smoke.ts` | Smoke | ¿Funcionan los endpoints con 1 usuario? | ~6 s |
| `k6/load.ts` | Carga | ¿Cumple SLO bajo carga normal (~30 clientes)? | ~4 min |
| `k6/stress.ts` | Estrés | ¿Dónde está el punto de quiebre? (50→300 VUs) | ~7 min |
| `k6/spike.ts` | Spike | ¿Absorbe una ráfaga súbita y se recupera? | ~2 min |
| `k6/soak.ts` | Soak | ¿Hay degradación/fugas con carga sostenida? | ~16 min (ajustable) |
| `k6/scalability.ts` | Escalabilidad | ¿Hasta qué RPS escala linealmente? (10→200 req/s) | ~8 min |

`k6/lib/` contiene la configuración (`config.ts`), los ids deterministas del
restaurante demo (`seed-data.ts`, alineados con `supabase/seed.sql`) y las
acciones + métricas custom reutilizadas por los escenarios (`workload.ts`).

## Requisitos

1. **k6** instalado: `brew install k6` (o ver https://k6.io/docs/get-started/installation).
2. **Supabase local** corriendo en Docker (provee la BD con el seed determinista):
   ```bash
   supabase start          # primera vez descarga imágenes
   supabase db reset        # aplica migraciones + supabase/seed.sql (restaurante demo)
   ```
3. **El `customer-portal` levantado apuntando al Supabase local.** Las apps leen el
   `.env` raíz (→ Supabase remoto), así que para las pruebas se usa un
   `apps/customer-portal/.env.local` (ignorado por git) con las claves locales
   (`supabase status -o env`) y se arranca el server **sin** el dotenv raíz:
   ```bash
   cd apps/customer-portal && npx next dev -p 3005
   ```
   > Para cifras realistas conviene probar el **build de producción**
   > (`next build && next start -p 3005`), no el modo dev.

## Cómo ejecutar

```bash
# Vía npm (desde la raíz del repo)
npm run loadtest:smoke
npm run loadtest:load
npm run loadtest:stress
npm run loadtest:spike
npm run loadtest:soak
npm run loadtest:scalability

# O directamente con k6
k6 run performance/k6/load.ts
```

### Variables de entorno útiles

| Variable | Efecto | Ejemplo |
|----------|--------|---------|
| `LOAD_BASE_URL` | URL de la app bajo prueba | `LOAD_BASE_URL=http://localhost:3005` |
| `LOAD_FACTOR` | Multiplica VUs/RPS de cualquier escenario | `LOAD_FACTOR=2` (doble carga) |
| `SOAK_DURATION` | Duración de la meseta del soak | `SOAK_DURATION=2h` |
| `K6_WEB_DASHBOARD` | Dashboard web en vivo (http://localhost:5665) | `K6_WEB_DASHBOARD=true` |

```bash
LOAD_FACTOR=0.5 k6 run performance/k6/stress.ts      # máquina modesta: media carga
k6 run --out json=performance/results/run.json performance/k6/scalability.ts
```

## Umbrales (SLO)

Definidos en `lib/config.ts` y por escenario. Los de carga/soak son estrictos
(p95 < 800 ms, errores < 1 %, creación de pedido p95 < 1200 ms); los de
estrés/spike/escalabilidad están relajados a propósito porque su objetivo es
**encontrar el límite**, no aprobar/reprobar. Cuando k6 reporta "thresholds…
have been crossed" en esos tres, eso ES el resultado: marca el punto de quiebre.

## Métricas custom

- `order_creation` — latencia aislada de `POST /api/orders` (camino crítico).
- `order_list` — latencia de `GET /api/orders` (polling del cliente).
- `orders_created` — contador de pedidos creados con éxito (201).

## Baseline (2026-06-16)

Medido en una sola máquina (macOS) con **Next.js en modo dev (Turbopack)** y
**Supabase local en Docker** compartiendo CPU con el generador de carga. Son
cifras **relativas** para detectar regresiones y ver la forma de la curva, **no**
la capacidad de producción (Vercel + Supabase cloud, build de producción, y
componentes separados serían bastante más rápidos).

| Escenario | Throughput | p95 | p99 / max | Errores | Veredicto |
|-----------|-----------|-----|-----------|---------|-----------|
| smoke | — | 52 ms | — | 0 % | ✓ |
| load (30 VUs) | ~40 req/s | 37.6 ms | 48.6 ms | 0 % | ✓ todos los SLO |
| stress (→300 VUs) | ~126 req/s pico | 2.55 s | p99 6.88 s / 7.6 s | 0.03 % | latencia se degrada bajo saturación |
| scalability (10→200 req/s) | sostiene hasta ~50–100 req/s | 2.38 s | p99 9.5 s / 25.7 s | 1.22 % | **knee** ~50–100 req/s; 1502 iters descartadas |

Salidas completas en `performance/results/*.txt`.

### Hallazgos

- Bajo carga normal el sistema responde excelente (p95 ~38 ms, 0 % error).
- El **punto de quiebre** aparece al empujar la tasa de llegada por encima de
  ~50–100 req/s: la latencia crece de forma no lineal y k6 empieza a descartar
  iteraciones (el backend no sostiene el RPS). Buena parte se explica por el
  **modo dev** y por compartir CPU con la BD; repetir con build de producción.
- El hotspot esperable es `POST /api/orders`: ejecuta ~5 queries **secuenciales**
  (verificar restaurante → menu_items → categorías → insert orders → insert items
  → update mesa). Es el primer candidato a optimizar (p. ej. consolidar queries
  o una función RPC en Postgres) si se requiere mayor throughput.

## Pendiente / siguientes pasos

- Repetir el baseline contra `next build && next start` para cifras de producción.
- Añadir un escenario de **Supabase Realtime** (N suscriptores concurrentes a
  `orders`) — requiere cliente WebSocket, fuera del alcance HTTP de k6 actual.
- Integrar `loadtest:smoke` + `loadtest:load` en CI (con Supabase local efímero).
