import Anthropic from '@anthropic-ai/sdk';

/** Presupuesto de caracteres del RFP por llamada (aprox. tokens). Override: EVAL_DOC_CHARS */
const DOC_CHARS = Number(process.env.EVAL_DOC_CHARS) || 90_000;
const DOC_OVERLAP = Number(process.env.EVAL_DOC_OVERLAP) || 2_000;
/** Specs por lote. Override: EVAL_SPEC_BATCH */
const SPEC_BATCH = Number(process.env.EVAL_SPEC_BATCH) || 40;

const STATUS_RANK = {
	no_encontrado: 1,
	ambiguo: 2,
	encontrado: 3,
	contradictorio: 4
};

/**
 * Evalúa el checklist contra el texto del RFP usando Claude.
 * Si el RFP o el checklist son grandes, parte en lotes y fusiona.
 */
export async function evaluateWithClaude({ checklist, documents }) {
	const apiKey = process.env.ANTHROPIC_API_KEY;
	if (!apiKey) {
		const e = new Error('ANTHROPIC_API_KEY no configurada en .env');
		e.status = 500;
		throw e;
	}

	const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
	const client = new Anthropic({ apiKey });

	const docsText = buildDocsText(documents);
	const docChunks = splitText(docsText, DOC_CHARS, DOC_OVERLAP);
	const specBatches = chunkArray(checklist, SPEC_BATCH);

	const partials = [];
	for (let di = 0; di < docChunks.length; di++) {
		for (let si = 0; si < specBatches.length; si++) {
			const parsed = await callClaude({
				client,
				model,
				checklistBatch: specBatches[si],
				docsChunk: docChunks[di],
				docIndex: di,
				docTotal: docChunks.length,
				specIndex: si,
				specTotal: specBatches.length
			});
			partials.push(parsed);
		}
	}

	return mergePartials(partials, checklist);
}

function buildDocsText(documents) {
	return (documents || [])
		.map((d) => {
			const kind = d.meta?.type || 'doc';
			const hint =
				kind === 'pdf' && d.meta?.pages
					? `PDF, ${d.meta.pages} páginas; respeta marcadores "--- Página N ---"`
					: kind === 'excel' && d.meta?.sheets?.length
						? `Excel; respeta marcadores "--- Hoja: … ---"`
						: kind;
			return `### Archivo: ${d.fileName} (${hint})\n${d.text || ''}`;
		})
		.join('\n\n');
}

/** Parte texto preferiendo cortes en marcadores de página/hoja. */
function splitText(text, maxChars, overlap) {
	const raw = String(text || '');
	if (!raw.trim()) return [''];
	if (raw.length <= maxChars) return [raw];

	const chunks = [];
	let start = 0;
	while (start < raw.length) {
		let end = Math.min(start + maxChars, raw.length);
		if (end < raw.length) {
			const window = raw.slice(start, end);
			const re = /\n--- (?:Página \d+|Hoja: [^\n]+) ---\n/g;
			let lastIdx = -1;
			let m;
			while ((m = re.exec(window))) {
				if (m.index > maxChars * 0.4) lastIdx = m.index;
			}
			if (lastIdx > 0) end = start + lastIdx;
		}
		chunks.push(raw.slice(start, end));
		if (end >= raw.length) break;
		start = Math.max(end - overlap, start + 1);
	}
	return chunks;
}

function chunkArray(arr, size) {
	const list = arr || [];
	if (list.length <= size) return [list];
	const out = [];
	for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
	return out;
}

async function callClaude({
	client,
	model,
	checklistBatch,
	docsChunk,
	docIndex,
	docTotal,
	specIndex,
	specTotal
}) {
	const checklistPayload = checklistBatch.map((s) => ({
		key: s.extractionKey,
		name: s.name,
		description: s.description,
		category: s.categoryName,
		unit: s.unitSymbol || null,
		altUnits: s.altUnitSymbols || [],
		synonyms: s.evaluationCriteria?.synonyms || [],
		instructions: s.evaluationCriteria?.instructions || '',
		examples: s.evaluationCriteria?.examples || []
	}));

	const system = `Eres un motor de extracción de especificaciones técnicas de construcción (RFP) para Lintel.
Evalúa CADA campo del checklist recibido contra el contenido del RFP (puede ser un fragmento).
Responde SOLO JSON válido (sin markdown) con esta forma:
{
  "findings": [
    {
      "extractionKey": "string",
      "status": "encontrado" | "no_encontrado" | "ambiguo" | "contradictorio",
      "value": "string|null",
      "unit": "string|null",
      "evidence": "fragmento textual|null",
      "sourceFile": "nombre archivo|null",
      "sourceRef": "página/hoja/sección|null",
      "confidence": 0.0,
      "notes": "string|null",
      "alternateValues": [{"value":"","unit":"","sourceFile":"","evidence":""}]
    }
  ],
  "additional": [
    {
      "description": "requisito técnico fuera del checklist",
      "value": "string|null",
      "unit": "string|null",
      "sourceFile": "string|null",
      "sourceRef": "string|null",
      "confidence": 0.0
    }
  ],
  "summary": "resumen breve en español"
}
Reglas:
- Incluye TODOS los campos del checklist recibido (no omitas ninguno).
- Si este fragmento no tiene evidencia para un campo, usa no_encontrado (otros fragmentos se fusionarán).
- Ambiguo: evidencia insuficiente o unidades contradictorias/ausentes.
- Contradictorio: valores distintos entre archivos; ponlos en alternateValues.
- additional: solo requisitos técnicos relevantes no cubiertos por el checklist, hallados en ESTE fragmento.
- sourceRef obligatorio si hay evidencia:
  · PDF: "página N" según el marcador "--- Página N ---" más cercano al fragmento.
  · Excel: "hoja Nombre" según "--- Hoja: Nombre ---".
  · Word: sección/título cercano si se identifica; si no, null.`;

	const loteNota =
		docTotal > 1 || specTotal > 1
			? `\n(Lote contenido ${docIndex + 1}/${docTotal}; lote checklist ${specIndex + 1}/${specTotal})\n`
			: '';

	const user = `CHECKLIST (${checklistPayload.length} campos):
${JSON.stringify(checklistPayload)}
${loteNota}
CONTENIDO RFP:
${docsChunk || '(sin texto extraíble)'}`;

	const msg = await client.messages.create({
		model,
		max_tokens: 8192,
		temperature: 0,
		system,
		messages: [{ role: 'user', content: user }]
	});

	const raw = msg.content?.filter((c) => c.type === 'text').map((c) => c.text).join('\n') || '';
	return parseJson(raw);
}

function parseJson(raw) {
	const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
	try {
		return JSON.parse(cleaned);
	} catch {
		const m = cleaned.match(/\{[\s\S]*\}/);
		if (m) return JSON.parse(m[0]);
		throw new Error('La IA no devolvió JSON válido');
	}
}

function mergePartials(partials, checklist) {
	const byKey = new Map();
	const additional = [];
	const summaries = [];

	for (const p of partials) {
		if (p?.summary) summaries.push(String(p.summary).trim());
		for (const f of p?.findings || []) {
			if (!f?.extractionKey) continue;
			const prev = byKey.get(f.extractionKey);
			byKey.set(f.extractionKey, prev ? mergeFinding(prev, f) : f);
		}
		for (const a of p?.additional || []) {
			const desc = String(a.description || '').trim();
			if (!desc) continue;
			const key = desc.toLowerCase();
			if (additional.some((x) => x.description.toLowerCase() === key)) continue;
			additional.push({
				description: desc,
				value: a.value ?? null,
				unit: a.unit ?? null,
				sourceFile: a.sourceFile ?? null,
				sourceRef: a.sourceRef ?? null,
				confidence: typeof a.confidence === 'number' ? a.confidence : null,
				status: 'pendiente'
			});
		}
	}

	const findings = checklist.map((s) => {
		const f = byKey.get(s.extractionKey) || {};
		const status = ['encontrado', 'no_encontrado', 'ambiguo', 'contradictorio'].includes(f.status)
			? f.status
			: 'no_encontrado';
		return {
			specificationId: s._id,
			extractionKey: s.extractionKey,
			name: s.name,
			categoryId: s.categoryId,
			categoryName: s.categoryName,
			isArchitectural: Boolean(s.isArchitectural),
			status,
			value: f.value ?? null,
			unit: f.unit ?? s.unitSymbol ?? null,
			evidence: f.evidence ?? null,
			sourceFile: f.sourceFile ?? null,
			sourceRef: f.sourceRef ?? null,
			confidence: typeof f.confidence === 'number' ? f.confidence : null,
			notes: f.notes ?? null,
			alternateValues: Array.isArray(f.alternateValues) ? f.alternateValues : [],
			observation: null
		};
	});

	const summary =
		summaries.length <= 1
			? summaries[0] || ''
			: summaries.filter(Boolean).slice(0, 3).join(' · ');

	return { findings, additional, summary };
}

function mergeFinding(a, b) {
	const vals = collectValues(a).concat(collectValues(b));
	const uniq = [];
	const seen = new Set();
	for (const v of vals) {
		const k = `${String(v.value).trim().toLowerCase()}|${String(v.unit || '').trim().toLowerCase()}`;
		if (!k.startsWith('|') && !seen.has(k)) {
			seen.add(k);
			uniq.push(v);
		}
	}

	const prefer = (STATUS_RANK[b.status] || 0) > (STATUS_RANK[a.status] || 0) ? b : a;
	const other = prefer === a ? b : a;
	const confidence = Math.max(
		typeof a.confidence === 'number' ? a.confidence : 0,
		typeof b.confidence === 'number' ? b.confidence : 0
	);

	if (uniq.length > 1) {
		return {
			...prefer,
			status: 'contradictorio',
			value: uniq[0].value,
			unit: uniq[0].unit ?? prefer.unit ?? null,
			evidence: prefer.evidence || other.evidence || null,
			sourceFile: prefer.sourceFile || other.sourceFile || null,
			sourceRef: prefer.sourceRef || other.sourceRef || null,
			confidence: confidence || null,
			notes: [a.notes, b.notes].filter(Boolean).join(' ') || null,
			alternateValues: uniq.slice(1)
		};
	}

	return {
		...prefer,
		evidence: prefer.evidence || other.evidence || null,
		sourceFile: prefer.sourceFile || other.sourceFile || null,
		sourceRef: prefer.sourceRef || other.sourceRef || null,
		confidence: confidence || prefer.confidence || null,
		notes: prefer.notes || other.notes || null,
		alternateValues: Array.isArray(prefer.alternateValues)
			? prefer.alternateValues
			: Array.isArray(other.alternateValues)
				? other.alternateValues
				: []
	};
}

function collectValues(f) {
	const out = [];
	if (f?.value != null && String(f.value).trim() !== '') {
		out.push({
			value: String(f.value),
			unit: f.unit ?? null,
			sourceFile: f.sourceFile ?? null,
			evidence: f.evidence ?? null
		});
	}
	for (const alt of f?.alternateValues || []) {
		if (alt?.value != null && String(alt.value).trim() !== '') {
			out.push({
				value: String(alt.value),
				unit: alt.unit ?? null,
				sourceFile: alt.sourceFile ?? null,
				evidence: alt.evidence ?? null
			});
		}
	}
	return out;
}
