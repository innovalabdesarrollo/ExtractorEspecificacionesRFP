/**
 * Evaluación demostrativa sin Claude.
 * Solo para pantallas / flujo local cuando falta ANTHROPIC_API_KEY.
 * No sustituye la evaluación real con IA.
 */

const DEMO_NOTICE =
	'MODO DEMO: falta ANTHROPIC_API_KEY en .env. Estos resultados son ilustrativos (reglas locales sobre el texto extraído), no una evaluación con Claude.';

/** Patrones alineados al fixture rfp-demo.* */
const PATTERNS = [
	{
		keys: ['area_total'],
		re: /(?:[áa]rea\s+total\s+construida|area\s+total\s+construida)\s*[:\t]?\s*([\d.,]+)\s*(m2|m²|m\u00b2)?/i,
		unit: 'm²'
	},
	{
		keys: ['altura_libre_acero'],
		re: /altura\s+libre\s+a\s+acero\s*[:\t]?\s*([\d.,]+)\s*(m)?/i,
		unit: 'm'
	},
	{
		keys: ['num_andenes'],
		re: /(?:n[uú]mero\s+de\s+andenes|numero\s+de\s+andenes)(?:\s+de\s+carga)?\s*[:\t]?\s*([\d.,]+)/i,
		unit: 'u'
	},
	{
		keys: ['sistema_estructural'],
		re: /sistema\s+estructural\s*[:\t]?\s*([a-záéíóúñ\w]+)/i,
		unit: null
	},
	{
		keys: ['capacidad_enfriamiento', 'sistema_hvac'],
		re: /(?:HVAC|capacidad\s+de\s+enfriamiento)\s*[:\t]?\s*([\d.,]+)\s*(TR|TR\.|ton)?/i,
		unit: 'TR',
		valueFrom: (m, key) => (key === 'sistema_hvac' ? `HVAC ${m[1]} ${m[2] || 'TR'}`.trim() : m[1])
	},
	{
		keys: ['capacidad_carga_piso'],
		re: /capacidad\s+de\s+carga\s+de\s+piso\s*[:\t]?\s*([\d.,]+)\s*(psf|psi)?/i,
		unit: 'psi'
	},
	{
		keys: ['demanda_electrica'],
		re: /demanda\s+el[eé]ctrica(?:\s+estimada)?\s*[:\t]?\s*([\d.,]+)\s*(kW|kw)?/i,
		unit: 'kW'
	}
];

/**
 * @param {{ checklist: any[], documents: { fileName: string, text: string }[] }} args
 */
export async function evaluateDemo({ checklist, documents }) {
	const corpus = (documents || [])
		.map((d) => `### ${d.fileName}\n${d.text || ''}`)
		.join('\n\n');

	const byKey = new Map();
	for (const p of PATTERNS) {
		const m = corpus.match(p.re);
		if (!m) continue;
		const sourceFile = guessSourceFile(documents, m[0]) || documents[0]?.fileName || null;
		for (const key of p.keys) {
			const value = p.valueFrom ? p.valueFrom(m, key) : m[1];
			const unit = p.unit || m[2] || null;
			byKey.set(key, {
				status: 'encontrado',
				value: String(value).replace(',', ''),
				unit,
				evidence: m[0].trim().slice(0, 240),
				sourceFile,
				sourceRef: null,
				confidence: 0.4,
				notes: 'Detectado en modo DEMO (sin Anthropic).'
			});
		}
	}

	const findings = (checklist || []).map((s) => {
		const hit = byKey.get(s.extractionKey) || {};
		const status = hit.status || 'no_encontrado';
		return {
			specificationId: s._id,
			extractionKey: s.extractionKey,
			name: s.name,
			categoryId: s.categoryId,
			categoryName: s.categoryName,
			isArchitectural: Boolean(s.isArchitectural),
			status,
			value: hit.value ?? null,
			unit: hit.unit ?? s.unitSymbol ?? null,
			evidence: hit.evidence ?? null,
			sourceFile: hit.sourceFile ?? null,
			sourceRef: hit.sourceRef ?? null,
			confidence: hit.confidence ?? null,
			notes: hit.notes ?? (status === 'no_encontrado' ? 'Sin coincidencia en modo DEMO.' : null),
			alternateValues: [],
			observation: null
		};
	});

	const additional = [];
	const addMatch = corpus.match(/requisito\s+adicional\s*:\s*([^\n.]+)/i);
	if (addMatch) {
		additional.push({
			description: addMatch[1].trim(),
			value: null,
			unit: null,
			sourceFile: guessSourceFile(documents, addMatch[0]) || documents[0]?.fileName || null,
			sourceRef: null,
			confidence: 0.4,
			status: 'pendiente'
		});
	}

	const found = findings.filter((f) => f.status === 'encontrado').length;
	return {
		findings,
		additional,
		summary: `${DEMO_NOTICE} Coincidencias locales: ${found} de ${findings.length} specs.`,
		demoMode: true,
		demoNotice: DEMO_NOTICE
	};
}

function guessSourceFile(documents, snippet) {
	const needle = String(snippet || '').slice(0, 40).toLowerCase();
	for (const d of documents || []) {
		if ((d.text || '').toLowerCase().includes(needle)) return d.fileName;
	}
	return null;
}
