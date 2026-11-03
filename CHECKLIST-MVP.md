# Checklist MVP — Extractor de Especificaciones de RFP (Lintel)

Marca con `[x]` conforme se valide/termine cada ítem.  
Fuente: `extractor-de-especificaciones-de-rfp-lintel-spec-mvp.md` + alcance acordado del MVP.

**Leyenda:** `[x]` hecho · `[ ]` pendiente · `~` parcial (existe base; falta validar o pulir)

**Stack fijo:** pnpm monorepo · `apps/web` SvelteKit+Tailwind · `apps/api` Express · MongoDB Atlas (`extractor_rfp_lintel`) · Claude (Anthropic)  
**Puertos:** API `3052` · Web `5192` (no matar procesos si chocan)

---

## 0. Infra / base

- [x] Monorepo pnpm (`apps/web` + `apps/api`)
- [x] MongoDB Atlas vía `MONGODB_URI` (DB en URI: `extractor_rfp_lintel`) — conexión verificada
- [x] `.env` / `.env.example` con `MONGODB_URI`, `PORT`, `WEB_PORT`, `PUBLIC_API_URL`, `ANTHROPIC_*`
- [x] Node ≥ 24.22.1 (parche CVE-2026-111497 / Node2Shell)
- [x] Seed checklist (~48 specs, 12 categorías, 15 unidades)
- [ ] `ANTHROPIC_API_KEY` en `.env` + `pnpm smoke` (**solo credencial del usuario**; código/UI/`pnpm check` listos)
- [x] Arranque local estable (`pnpm dev` vía `dev-local.mjs`; watch acotado API/Vite; nota EMFILE/polling)
- [x] Health + banner UI si falta Claude; `pnpm check` (listo-para-credenciales)
- [x] Deploy monorepo → **un Vercel** (`adapter-vercel` + `api/index.js` serverless; GitHub)

---

## 1. Analista de propuestas

| # | Característica | Estado |
| --- | --- | --- |
| 1.1 | Registrar proyecto y cliente (obligatorios, no vacíos) | [x] |
| 1.2 | Cargar uno/varios archivos RFP (PDF, Word, Excel) | [x] |
| 1.3 | Validar formatos y rechazar incompatibles con mensaje claro | [x] |
| 1.4 | Listar archivos: nombre, tipo, tamaño, fecha, estado | [x] |
| 1.5 | Eliminar archivo antes del análisis | [x] |
| 1.6 | Ejecutar análisis solo con ≥1 archivo válido | [x] |
| 1.7 | Estados: pendiente / procesando / completado / fallido | [x] |
| 1.8 | Mensaje de error + reintentar sin perder archivos | [x] |
| 1.9 | Consultar specs detectadas (nombre, estado, valor, unidad, archivo) | [x] |
| 1.10 | Consultar evidencia / fragmento de respaldo | [x] |
| 1.11 | Filtrar: encontradas / no encontradas / ambiguas | [x] |
| 1.12 | Sección de especificaciones adicionales | [x] |
| 1.13 | Observaciones internas por especificación (alta/edición) | [x] |
| 1.14 | Historial: filtrar por proyecto, cliente, fecha | [x] |
| 1.15 | Abrir detalle de un análisis guardado | [x] |

**Pendiente de pulir (analista):**

- [x] Edición de observación existente desde UI (alta + PATCH; upsert por analysisId+key)
- [x] Progreso en vivo más fino por etapa (extracción / evaluación / consolidación) en UI
- [x] Manejo UX de archivos dañados vs solo formato inválido
- [x] Prueba E2E / smoke API (PDF+Word+Excel + Claude) — `pnpm smoke`; Claude solo si hay `ANTHROPIC_API_KEY`

---

## 2. Administrador de especificaciones

| # | Característica | Estado |
| --- | --- | --- |
| 2.1 | Crear especificación (nombre, descripción, categoría, unidad, estado) | [x] |
| 2.2 | No permitir nombres duplicados en la misma categoría | [x] |
| 2.3 | Editar especificación (nombre, desc, categoría, unidad, criterios) | [x] |
| 2.4 | Activar / desactivar sin eliminar | [x] |
| 2.5 | Crear / editar / desactivar categorías + orden | [x] |
| 2.6 | Marcar categorías arquitectónicas | [x] |
| 2.7 | Configurar unidades (principal; alternativas en modelo) | [x] |
| 2.8 | Criterios IA: instrucciones, sinónimos, ejemplos | [x] |
| 2.9 | Consultar / filtrar checklist (categoría, estado, texto) | [x] |
| 2.10 | Validar integridad del checklist | [x] |
| 2.11 | Historial de cambios del checklist | [x] |
| 2.12 | Duplicar especificación (exige nombre único) | [x] |

**Pendiente de pulir (admin):**

- [x] Formulario de edición completa de spec en UI (crear/editar + criterios)
- [x] Reordenar categorías (controles ↑ ↓; API displayOrder)
- [x] UI para unidades alternativas por spec (+ envío a Claude en evaluación)
- [x] UI para editar ejemplos de criterios (instrucciones + sinónimos + ejemplos)
- [x] Filtrar por tipo de dato en listado (`dataType`)
- [x] Editar nombre/descripción de categoría en UI (activar/orden ya cubiertos)

---

## 3. Motor de extracción y evaluación (IA)

| # | Característica | Estado |
| --- | --- | --- |
| 3.1 | Extraer texto PDF | [x] |
| 3.2 | Extraer texto Word (.docx) | [x] |
| 3.3 | Extraer texto Excel (.xlsx vía ExcelJS) | [x] |
| 3.4 | Conservar relación fragmento ↔ archivo de origen | [x] |
| 3.5 | Reportar archivos que no se pudieron procesar | [x] |
| 3.6 | Evaluar cada campo activo del checklist (no omitir) | [x] |
| 3.7 | Estados: encontrado / no_encontrado / ambiguo / contradictorio | [x] |
| 3.8 | Extraer valor + unidad | [x] |
| 3.9 | Vincular fuente (archivo + ref página/hoja/sección) | [x] |
| 3.10 | Detectar requisitos adicionales fuera del checklist | [x] |
| 3.11 | Marcar ambigüedad / contradicción entre archivos | [x] |
| 3.12 | Consolidar resultados de múltiples archivos | [x] |
| 3.13 | Guardar resultado estructurado en Mongo | [x] |
| 3.14 | Seguimiento de etapas y errores | [x] |
| 3.15 | Control de calidad estructural básico antes de guardar | [x] |

**Pendiente de pulir (motor):**

- [x] Validar calidad de extracción (`pnpm validate:extract` + fixtures; RFPs reales → `scripts/fixtures/lintel/`)
- [x] Mejorar referencia de página en PDF (marcadores `--- Página N ---` + prompt sourceRef)
- [x] Soporte robusto `.doc` / `.xls` legacy (`word-extractor` + `xls-reader`; `.docx`/`.xlsx` sin cambio)
- [x] Chunking / lotes si el RFP o checklist son grandes (fragmentos RFP + batches de specs; fusión de findings)
- [x] Lock 1 análisis en curso por proyecto (índice único parcial + 409; libera atascados)

---

## 4. Arquitecto

| # | Característica | Estado |
| --- | --- | --- |
| 4.1 | Consultar specs arquitectónicas (categorías `isArchitectural`) | [x] |
| 4.2 | Ver evidencia / fuente de cada requisito arq. | [x] |
| 4.3 | Filtrar faltantes arquitectónicos | [x] |
| 4.4 | Revisar adicionales (vista compartida con analista) | [x] |
| 4.5 | Comparar requisitos entre versiones del RFP | [x] |
| 4.6 | Exportar resumen (CSV) encontrado / faltante / adicional | [x] |

**Pendiente de pulir (arquitecto):**

- [x] Export PDF/DOCX además de CSV/JSON (`format=pdf|docx|csv|json`)
- [x] Vista dedicada arquitecto (`/arquitecto/[id]`: resumen, por categoría, evidencia, export)
- [x] Diff visual más rico entre versiones (`VersionDiff`: solo cambios, side-by-side A/B, filtros)

---

## 5. Pantallas / UX

- [x] Proyectos (alta + listado)
- [x] Detalle de proyecto (archivos + análisis)
- [x] Resultados del análisis (+ filtros + adicionales + observaciones)
- [x] Historial
- [x] Checklist admin (tabs: specs / categorías / unidades / historial)
- [x] Vista arquitecto (filtro + export + comparar)
- [x] UI responsive (móvil-first: nav sticky, tablas scroll/columnas, botones full-width, tap targets) — QA en dispositivo físico recomendado
- [x] Mensajes de vacío / error / loading coherentes (`Alert` / `Empty` / `Loading`)
- [x] Editar datos del proyecto desde UI (nombre, cliente, descripción)

---

## 6. Modelo Mongo (MVP consolidado)

- [x] `projects`
- [x] `files`
- [x] `categories`
- [x] `units`
- [x] `specifications` (criterios embebidos)
- [x] `checklist_changes`
- [x] `analyses` (findings + additional embebidos)
- [x] `observations`
- [x] Índices útiles (projects/files/analyses/observations/specs/categories/…) al arrancar API
- [x] Limpieza uploads huérfanos (arranque API + `pnpm cleanup:uploads`)

---

## Fuera de alcance (no integrar en este MVP)

Explicitamente **no** van en esta entrega:

- Auth con Google / OAuth / login completo de usuarios
- Envío de correo (notificaciones, invitaciones, etc.)
- Next.js / Supabase (el spec original los menciona; stack fijado: SvelteKit + Mongo)
- App móvil nativa
- Roles con permisos reales (admin vs analista vs arquitecto) — UI abierta sin auth
- Cliente externo como actor con portal propio
- Versionado formal de checklist (configuración versionable publicada / borrador / archivada) más allá del historial de cambios
- Entidades del modelo “completo” del spec como colecciones separadas (31 objetos): se consolidaron en las 8 colecciones MVP
- Exportación avanzada multi-formato de diseño (planos, BIM, etc.)
- Integraciones ERP / CRM / Drive / SharePoint
- OCR de PDFs escaneados (imágenes sin texto)
- Facturación, multi-tenant SaaS, billing
- Features “nice to have” de prioridad Baja no críticas fuera del flujo principal (salvo duplicar spec, ya incluido)
- Matar procesos de otras apps Innovalab si el puerto está ocupado — **prohibido**; se cambia `PORT`/`WEB_PORT` en `.env`

---

## Cómo usar esta checklist

1. Al terminar una fila: cambia `[ ]` → `[x]` (o `~` → `[x]` si se cerró el pendiente).
2. Si aparece algo nuevo del spec que sí entre al MVP: agrégalo en la sección correcta.
3. Si es claramente post-MVP: muévelo a **Fuera de alcance**, no lo implementes “de pasada”.
