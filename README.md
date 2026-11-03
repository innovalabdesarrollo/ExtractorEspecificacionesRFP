# Extractor de Especificaciones de RFP (Lintel) — MVP

Monorepo pnpm listo para **un solo proyecto Vercel** (web SvelteKit + API Express serverless) vía GitHub.

- `apps/web` — SvelteKit + Tailwind (`@sveltejs/adapter-vercel`)
- `apps/api` — Express + MongoDB Atlas
- `api/index.js` — entrada serverless de la API en el mismo deploy

## Requisitos

- **Node.js ≥ 22** (local recomendado ≥ 24.22.1 por parches de seguridad)
- pnpm 9
- MongoDB Atlas (URI con DB `extractor_rfp_lintel`)
- `ANTHROPIC_API_KEY` para análisis Claude (sin key = modo DEMO)

## Puertos (no chocar con otras apps Innovalab)

| Servicio | Variable   | Default |
| -------- | ---------- | ------- |
| API      | `PORT`     | `3052`  |
| Web      | `WEB_PORT` | `5192`  |

Si el puerto está ocupado: **no mates el proceso** (puede ser otra app). Cambia `PORT` / `WEB_PORT` en `.env` y alinea `PUBLIC_API_URL` / `CORS_ORIGIN`.

## Arranque local

```bash
cp .env.example .env   # completa MONGODB_URI y ANTHROPIC_API_KEY
pnpm i
pnpm seed              # checklist ~45 specs
pnpm dev               # API + web (watch acotado; evita EMFILE)
```

- Web: http://localhost:5192  
- API: http://localhost:3052/api/health  

O por separado: `pnpm dev:api` · `pnpm dev:web`

Si aparece **EMFILE** (demasiados archivos abiertos):

```bash
ulimit -n 65536
# o
CHOKIDAR_USEPOLLING=1 pnpm dev
```

## Listo para credenciales

```bash
pnpm check          # Node, .env, fixtures, extracción; avisa si falta ANTHROPIC_API_KEY
```

La UI muestra un aviso si la API está arriba y aún no hay key de Anthropic.

## Pruebas

```bash
pnpm test           # unitarias API (integridad, extracción, demo, health)
pnpm test:e2e       # Playwright: home + flujo DEMO (proyecto → upload → análisis)
```

Con API+web arriba (`pnpm dev`). Playwright reutiliza servidores locales si ya corren.

## Smoke E2E

Con la API arriba (`pnpm dev:api`):

```bash
pnpm smoke
```

- Sin `ANTHROPIC_API_KEY`: health, upload, integridad y **análisis DEMO** (coincidencias locales; el resultado indica que falta la key).
- Con key en `.env`: análisis real con Claude + findings + export.

Fixtures: `scripts/fixtures/rfp-demo.{pdf,doc,docx,xls,xlsx}`

## Calidad de extracción

Sin Claude (solo texto extraído):

```bash
pnpm validate:extract
```

Coloca RFPs reales Lintel en `scripts/fixtures/lintel/` y vuelve a ejecutar. Reporte en `scripts/reports/extract-quality.json`.

## Publicar en Vercel (GitHub → un solo proyecto)

1. Sube el monorepo a GitHub (raíz del repo = esta carpeta).
2. En [vercel.com](https://vercel.com): **Add New Project** → importa el repo.
3. Ajustes del proyecto:
   - **Root Directory:** vacío / `.` (raíz del monorepo, no `apps/web`)
   - **Framework:** Other (usa `vercel.json` + Build Output de SvelteKit)
   - **Install / Build:** ya vienen en `vercel.json` (`pnpm install` · `pnpm --filter @extractor-rfp/web build`)
4. **Environment Variables** (Production + Preview):

   | Variable | Valor |
   | -------- | ----- |
   | `MONGODB_URI` | URI Atlas con `/extractor_rfp_lintel` |
   | `ANTHROPIC_API_KEY` | key Anthropic (opcional al inicio; sin ella = DEMO) |
   | `ANTHROPIC_MODEL` | `claude-sonnet-4-20250514` (opcional) |
   | `PUBLIC_API_URL` | **vacío** (same-origin `/api`) |
   | `CORS_ORIGIN` | `https://tu-dominio.vercel.app` (opcional; en Vercel se acepta el propio host) |

5. Deploy. Luego en local (con la misma URI): `pnpm seed` una vez para el checklist.
6. Cada push a la rama de producción redeploya automáticamente.

Notas Vercel:

- Uploads se guardan en Mongo (binario) porque el disco `/tmp` no persiste entre invocaciones.
- Análisis usa `waitUntil` / timeout de función hasta 300s (`vercel.json`).
- Local sigue con `pnpm dev` (API `:3052` + web `:5192`).
