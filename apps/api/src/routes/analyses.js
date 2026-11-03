import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';
import { isVercel } from '../paths.js';
import { extractFileText } from '../services/extract.js';
import { evaluateWithClaude } from '../services/evaluate.js';
import { evaluateDemo } from '../services/evaluateDemo.js';
import { buildDocxBuffer, buildPdfBuffer, exportFilename } from '../services/exportReport.js';
import { findRunningAnalysis, releaseStaleAnalyses } from '../services/analysisLock.js';
import { materializeFile } from '../services/fileStore.js';

const router = Router();

function oid(id) {
	if (!ObjectId.isValid(id)) {
		const e = new Error('ID inválido');
		e.status = 400;
		throw e;
	}
	return new ObjectId(id);
}

router.get('/', async (req, res, next) => {
	try {
		const q = {};
		if (req.query.projectId) q.projectId = oid(String(req.query.projectId));
		if (req.query.status) q.status = String(req.query.status);
		const items = await getDb().collection('analyses').find(q).sort({ startedAt: -1 }).toArray();
		res.json(items);
	} catch (e) {
		next(e);
	}
});

router.get('/compare/:projectId', async (req, res, next) => {
	try {
		const projectId = oid(req.params.projectId);
		const aId = req.query.a;
		const bId = req.query.b;
		if (!aId || !bId) return res.status(400).json({ error: 'Parámetros a y b (ids de análisis) requeridos' });
		const [a, b] = await Promise.all([
			getDb().collection('analyses').findOne({ _id: oid(String(aId)), projectId }),
			getDb().collection('analyses').findOne({ _id: oid(String(bId)), projectId })
		]);
		if (!a || !b) return res.status(404).json({ error: 'Análisis no encontrados' });

		const mapB = new Map((b.findings || []).map((f) => [f.extractionKey, f]));
		const changes = [];
		for (const fa of a.findings || []) {
			const fb = mapB.get(fa.extractionKey);
			if (!fb) {
				changes.push({ key: fa.extractionKey, name: fa.name, type: 'eliminado', a: fa, b: null });
				continue;
			}
			const same =
				fa.status === fb.status &&
				String(fa.value || '') === String(fb.value || '') &&
				String(fa.unit || '') === String(fb.unit || '');
			changes.push({
				key: fa.extractionKey,
				name: fa.name,
				type: same ? 'sin_cambio' : 'modificado',
				a: fa,
				b: fb
			});
			mapB.delete(fa.extractionKey);
		}
		for (const fb of mapB.values()) {
			changes.push({ key: fb.extractionKey, name: fb.name, type: 'nuevo', a: null, b: fb });
		}
		res.json({
			a: { id: a._id, versionLabel: a.versionLabel, startedAt: a.startedAt },
			b: { id: b._id, versionLabel: b.versionLabel, startedAt: b.startedAt },
			changes
		});
	} catch (e) {
		next(e);
	}
});

router.get('/:id/export', async (req, res, next) => {
	try {
		const analysis = await getDb().collection('analyses').findOne({ _id: oid(req.params.id) });
		if (!analysis) return res.status(404).json({ error: 'Análisis no encontrado' });
		const project = await getDb().collection('projects').findOne({ _id: analysis.projectId });
		const format = String(req.query.format || 'json');
		const architecturalOnly = req.query.architectural === '1';

		let findings = analysis.findings || [];
		if (architecturalOnly) findings = findings.filter((f) => f.isArchitectural);

		const payload = {
			proyecto: project?.name,
			cliente: project?.clientName,
			fecha: analysis.completedAt || analysis.startedAt,
			versionLabel: analysis.versionLabel,
			encontrados: findings.filter((f) => f.status === 'encontrado'),
			faltantes: findings.filter((f) => f.status === 'no_encontrado'),
			ambiguos: findings.filter((f) => f.status === 'ambiguo' || f.status === 'contradictorio'),
			adicionales: analysis.additional || [],
			summary: analysis.summary
		};

		const baseName = exportFilename(project?.name || 'export', 'x').replace(/\.x$/, '');

		if (format === 'csv') {
			const rows = [['tipo', 'nombre', 'estado', 'valor', 'unidad', 'archivo', 'evidencia']];
			for (const f of findings) {
				rows.push([
					'checklist',
					f.name,
					f.status,
					f.value || '',
					f.unit || '',
					f.sourceFile || '',
					(f.evidence || '').replace(/\n/g, ' ')
				]);
			}
			for (const a of payload.adicionales) {
				rows.push([
					'adicional',
					a.description,
					a.status || '',
					a.value || '',
					a.unit || '',
					a.sourceFile || '',
					''
				]);
			}
			const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
			res.setHeader('Content-Type', 'text/csv; charset=utf-8');
			res.setHeader('Content-Disposition', `attachment; filename="${baseName}.csv"`);
			return res.send(csv);
		}

		if (format === 'pdf') {
			const buf = await buildPdfBuffer(payload);
			res.setHeader('Content-Type', 'application/pdf');
			res.setHeader('Content-Disposition', `attachment; filename="${baseName}.pdf"`);
			return res.send(buf);
		}

		if (format === 'docx') {
			const buf = await buildDocxBuffer(payload);
			res.setHeader(
				'Content-Type',
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
			);
			res.setHeader('Content-Disposition', `attachment; filename="${baseName}.docx"`);
			return res.send(buf);
		}

		res.json(payload);
	} catch (e) {
		next(e);
	}
});

router.get('/:id', async (req, res, next) => {
	try {
		const item = await getDb().collection('analyses').findOne({ _id: oid(req.params.id) });
		if (!item) return res.status(404).json({ error: 'Análisis no encontrado' });
		res.json(item);
	} catch (e) {
		next(e);
	}
});

router.post('/project/:projectId', async (req, res, next) => {
	try {
		const db = getDb();
		const projectId = oid(req.params.projectId);
		const project = await db.collection('projects').findOne({ _id: projectId });
		if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

		const files = await db.collection('files').find({ projectId }).toArray();
		if (!files.length) {
			return res.status(400).json({ error: 'Se requiere al menos un archivo válido para analizar' });
		}

		await releaseStaleAnalyses(db, projectId);
		const running = await findRunningAnalysis(db, projectId);
		if (running) {
			return res.status(409).json({
				error: `Ya hay un análisis en curso (${running.versionLabel}). Espera a que termine o falle.`,
				analysisId: running._id,
				versionLabel: running.versionLabel
			});
		}

		const versionCount = await db.collection('analyses').countDocuments({ projectId });
		const analysis = {
			projectId,
			projectName: project.name,
			clientName: project.clientName,
			versionLabel: `v${versionCount + 1}`,
			status: 'procesando',
			stage: 'extraccion',
			progressPercentage: 5,
			errorMessage: null,
			startedAt: new Date(),
			completedAt: null,
			summary: null,
			findings: [],
			additional: [],
			fileResults: [],
			stages: [
				{ stage: 'extraccion', status: 'en_progreso', startedAt: new Date() },
				{ stage: 'evaluacion', status: 'pendiente' },
				{ stage: 'consolidacion', status: 'pendiente' }
			]
		};

		let analysisId;
		try {
			const ins = await db.collection('analyses').insertOne(analysis);
			analysisId = ins.insertedId;
		} catch (e) {
			if (e?.code === 11000) {
				const again = await findRunningAnalysis(db, projectId);
				return res.status(409).json({
					error: again
						? `Ya hay un análisis en curso (${again.versionLabel}). Espera a que termine o falle.`
						: 'Ya hay un análisis en curso para este proyecto.',
					analysisId: again?._id,
					versionLabel: again?.versionLabel
				});
			}
			throw e;
		}

		const job = runAnalysis(analysisId, projectId, files).catch(async (err) => {
			console.error('Análisis fallido', err);
			await getDb().collection('analyses').updateOne(
				{ _id: analysisId },
				{
					$set: {
						status: 'fallido',
						errorMessage: err.message || 'Error desconocido',
						completedAt: new Date(),
						progressPercentage: 100
					}
				}
			);
		});

		// En Vercel el background tras 202 no es fiable: usamos waitUntil o await
		if (isVercel()) {
			try {
				const { waitUntil } = await import('@vercel/functions');
				waitUntil(job);
			} catch {
				await job;
			}
		}

		res.status(202).json({ _id: analysisId, status: 'procesando', versionLabel: analysis.versionLabel });

		if (!isVercel()) {
			/* job ya corre en background (promesa sin await) */
		}
	} catch (e) {
		next(e);
	}
});

async function runAnalysis(analysisId, projectId, files) {
	const db = getDb();
	const documents = [];
	const fileResults = [];

	for (const f of files) {
		const abs = materializeFile(f);
		const result = await extractFileText(abs, f.fileType, f.fileName);
		fileResults.push({
			fileId: f._id,
			fileName: f.fileName,
			ok: result.ok,
			error: result.error || null,
			meta: result.meta || null
		});
		await db.collection('files').updateOne(
			{ _id: f._id },
			{ $set: { processingStatus: result.ok ? 'extraido' : 'error', lastError: result.error || null } }
		);
		if (result.ok && result.text?.trim()) {
			documents.push({ fileName: f.fileName, text: result.text, meta: result.meta });
		}
	}

	await db.collection('analyses').updateOne(
		{ _id: analysisId },
		{
			$set: {
				stage: 'evaluacion',
				progressPercentage: 40,
				fileResults,
				'stages.0.status': 'completada',
				'stages.0.completedAt': new Date(),
				'stages.1.status': 'en_progreso',
				'stages.1.startedAt': new Date()
			}
		}
	);

	const specs = await db.collection('specifications').find({ isActive: true }).toArray();
	const categories = await db.collection('categories').find({}).toArray();
	const units = await db.collection('units').find({}).toArray();
	const catMap = new Map(categories.map((c) => [String(c._id), c]));
	const unitMap = new Map(units.map((u) => [String(u._id), u]));

	const checklist = specs.map((s) => {
		const cat = catMap.get(String(s.categoryId));
		const unit = s.unitId ? unitMap.get(String(s.unitId)) : null;
		const altSymbols = (s.altUnitIds || [])
			.map((id) => unitMap.get(String(id))?.symbol)
			.filter(Boolean);
		return {
			...s,
			categoryName: cat?.name || '',
			isArchitectural: Boolean(cat?.isArchitectural),
			unitSymbol: unit?.symbol || null,
			altUnitSymbols: altSymbols
		};
	});

	if (!checklist.length) {
		throw new Error('Checklist vacío. Ejecuta pnpm seed o crea especificaciones activas.');
	}

	const claudeConfigured = Boolean(process.env.ANTHROPIC_API_KEY?.trim());
	const evaluated = claudeConfigured
		? await evaluateWithClaude({ checklist, documents })
		: await evaluateDemo({ checklist, documents });

	await db.collection('analyses').updateOne(
		{ _id: analysisId },
		{
			$set: {
				stage: 'consolidacion',
				progressPercentage: 85,
				'stages.1.status': 'completada',
				'stages.1.completedAt': new Date(),
				'stages.2.status': 'en_progreso',
				'stages.2.startedAt': new Date(),
				demoMode: Boolean(evaluated.demoMode)
			}
		}
	);

	// Control de calidad estructural básico
	const qualityIssues = [];
	for (const f of evaluated.findings) {
		if (!f.extractionKey) qualityIssues.push('finding sin extractionKey');
		if (!f.status) qualityIssues.push(`finding ${f.extractionKey} sin status`);
		if (f.status === 'encontrado' && !f.value && !f.evidence) {
			f.status = 'ambiguo';
			f.notes = (f.notes || '') + ' Marcado ambiguo por falta de valor/evidencia.';
		}
	}
	if (evaluated.demoMode) {
		qualityIssues.push('demo_sin_anthropic_api_key');
	}

	await db.collection('analyses').updateOne(
		{ _id: analysisId },
		{
			$set: {
				status: 'completado',
				stage: 'completado',
				progressPercentage: 100,
				completedAt: new Date(),
				summary: evaluated.summary,
				findings: evaluated.findings,
				additional: evaluated.additional,
				qualityIssues,
				demoMode: Boolean(evaluated.demoMode),
				demoNotice: evaluated.demoNotice || null,
				'stages.2.status': 'completada',
				'stages.2.completedAt': new Date()
			}
		}
	);

	await db.collection('projects').updateOne(
		{ _id: projectId },
		{ $set: { status: 'analizado', updatedAt: new Date() } }
	);
}

export default router;
