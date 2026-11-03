import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';

const router = Router();

function oid(id) {
	if (!ObjectId.isValid(id)) {
		const e = new Error('ID inválido');
		e.status = 400;
		throw e;
	}
	return new ObjectId(id);
}

async function logChange({ extractionKey, tipoCambio, valorAnterior, valorNuevo, usuario = 'admin' }) {
	await getDb().collection('checklist_changes').insertOne({
		especificacionClave: extractionKey,
		tipoCambio,
		valorAnterior: valorAnterior ?? null,
		valorNuevo: valorNuevo ?? null,
		usuarioId: usuario,
		changedAt: new Date()
	});
}

/* ---------- Unidades ---------- */
router.get('/units', async (_req, res, next) => {
	try {
		const items = await getDb().collection('units').find({}).sort({ name: 1 }).toArray();
		res.json(items);
	} catch (e) {
		next(e);
	}
});

router.post('/units', async (req, res, next) => {
	try {
		const name = String(req.body?.name || '').trim();
		const symbol = String(req.body?.symbol || '').trim();
		const measurementType = String(req.body?.measurementType || '').trim() || 'otro';
		if (!name || !symbol) return res.status(400).json({ error: 'name y symbol son obligatorios' });
		const doc = {
			name,
			symbol,
			measurementType,
			conversionFactor: req.body?.conversionFactor ?? null,
			isActive: true,
			createdAt: new Date()
		};
		const r = await getDb().collection('units').insertOne(doc);
		res.status(201).json({ ...doc, _id: r.insertedId });
	} catch (e) {
		next(e);
	}
});

router.patch('/units/:id', async (req, res, next) => {
	try {
		const updates = {};
		for (const k of ['name', 'symbol', 'measurementType']) {
			if (req.body?.[k] !== undefined) updates[k] = String(req.body[k]).trim();
		}
		if (req.body?.conversionFactor !== undefined) updates.conversionFactor = req.body.conversionFactor;
		if (req.body?.isActive !== undefined) updates.isActive = Boolean(req.body.isActive);
		const r = await getDb()
			.collection('units')
			.findOneAndUpdate({ _id: oid(req.params.id) }, { $set: updates }, { returnDocument: 'after' });
		if (!r) return res.status(404).json({ error: 'Unidad no encontrada' });
		res.json(r);
	} catch (e) {
		next(e);
	}
});

/* ---------- Categorías ---------- */
router.get('/categories', async (_req, res, next) => {
	try {
		const items = await getDb().collection('categories').find({}).sort({ displayOrder: 1 }).toArray();
		res.json(items);
	} catch (e) {
		next(e);
	}
});

router.post('/categories', async (req, res, next) => {
	try {
		const name = String(req.body?.name || '').trim();
		if (!name) return res.status(400).json({ error: 'name es obligatorio' });
		const count = await getDb().collection('categories').countDocuments();
		const doc = {
			name,
			description: String(req.body?.description || '').trim(),
			displayOrder: Number(req.body?.displayOrder ?? count + 1),
			isActive: true,
			isArchitectural: Boolean(req.body?.isArchitectural),
			createdAt: new Date()
		};
		const r = await getDb().collection('categories').insertOne(doc);
		res.status(201).json({ ...doc, _id: r.insertedId });
	} catch (e) {
		next(e);
	}
});

router.patch('/categories/:id', async (req, res, next) => {
	try {
		const updates = {};
		if (req.body?.name !== undefined) updates.name = String(req.body.name).trim();
		if (req.body?.description !== undefined) updates.description = String(req.body.description).trim();
		if (req.body?.displayOrder !== undefined) updates.displayOrder = Number(req.body.displayOrder);
		if (req.body?.isActive !== undefined) updates.isActive = Boolean(req.body.isActive);
		if (req.body?.isArchitectural !== undefined) updates.isArchitectural = Boolean(req.body.isArchitectural);
		const r = await getDb()
			.collection('categories')
			.findOneAndUpdate({ _id: oid(req.params.id) }, { $set: updates }, { returnDocument: 'after' });
		if (!r) return res.status(404).json({ error: 'Categoría no encontrada' });
		res.json(r);
	} catch (e) {
		next(e);
	}
});

/* ---------- Especificaciones ---------- */
router.get('/specs', async (req, res, next) => {
	try {
		const q = {};
		if (req.query.categoryId) q.categoryId = oid(String(req.query.categoryId));
		if (req.query.isActive === 'true') q.isActive = true;
		if (req.query.isActive === 'false') q.isActive = false;
		if (req.query.dataType) q.dataType = String(req.query.dataType).trim();
		if (req.query.q) {
			q.$or = [
				{ name: { $regex: String(req.query.q), $options: 'i' } },
				{ extractionKey: { $regex: String(req.query.q), $options: 'i' } }
			];
		}
		const items = await getDb().collection('specifications').find(q).sort({ name: 1 }).toArray();
		res.json(items);
	} catch (e) {
		next(e);
	}
});

router.post('/specs', async (req, res, next) => {
	try {
		const name = String(req.body?.name || '').trim();
		const categoryId = req.body?.categoryId;
		const extractionKey = String(req.body?.extractionKey || '').trim() || slug(name);
		if (!name || !categoryId) {
			return res.status(400).json({ error: 'name y categoryId son obligatorios' });
		}
		const dup = await getDb().collection('specifications').findOne({
			categoryId: oid(categoryId),
			name
		});
		if (dup) return res.status(409).json({ error: 'Ya existe una especificación con ese nombre en la categoría' });

		const doc = {
			name,
			description: String(req.body?.description || '').trim(),
			categoryId: oid(categoryId),
			unitId: req.body?.unitId ? oid(req.body.unitId) : null,
			altUnitIds: (req.body?.altUnitIds || []).filter(Boolean).map(oid),
			extractionKey,
			requiresMeasurement: Boolean(req.body?.requiresMeasurement),
			dataType: String(req.body?.dataType || 'texto'),
			evaluationCriteria: {
				instructions: String(req.body?.evaluationCriteria?.instructions || '').trim(),
				synonyms: Array.isArray(req.body?.evaluationCriteria?.synonyms)
					? req.body.evaluationCriteria.synonyms.map(String)
					: [],
				examples: Array.isArray(req.body?.evaluationCriteria?.examples)
					? req.body.evaluationCriteria.examples.map(String)
					: []
			},
			isActive: req.body?.isActive !== false,
			createdAt: new Date(),
			updatedAt: new Date()
		};
		const r = await getDb().collection('specifications').insertOne(doc);
		await logChange({
			extractionKey,
			tipoCambio: 'creacion',
			valorNuevo: doc
		});
		res.status(201).json({ ...doc, _id: r.insertedId });
	} catch (e) {
		next(e);
	}
});

router.patch('/specs/:id', async (req, res, next) => {
	try {
		const prev = await getDb().collection('specifications').findOne({ _id: oid(req.params.id) });
		if (!prev) return res.status(404).json({ error: 'Especificación no encontrada' });

		const updates = { updatedAt: new Date() };
		if (req.body?.name !== undefined) updates.name = String(req.body.name).trim();
		if (req.body?.description !== undefined) updates.description = String(req.body.description).trim();
		if (req.body?.categoryId !== undefined) updates.categoryId = oid(req.body.categoryId);
		if (req.body?.unitId !== undefined) updates.unitId = req.body.unitId ? oid(req.body.unitId) : null;
		if (req.body?.altUnitIds !== undefined) {
			updates.altUnitIds = (req.body.altUnitIds || []).filter(Boolean).map(oid);
		}
		if (req.body?.extractionKey !== undefined) updates.extractionKey = String(req.body.extractionKey).trim();
		if (req.body?.requiresMeasurement !== undefined)
			updates.requiresMeasurement = Boolean(req.body.requiresMeasurement);
		if (req.body?.dataType !== undefined) updates.dataType = String(req.body.dataType);
		if (req.body?.evaluationCriteria !== undefined) {
			updates.evaluationCriteria = {
				instructions: String(req.body.evaluationCriteria.instructions || '').trim(),
				synonyms: Array.isArray(req.body.evaluationCriteria.synonyms)
					? req.body.evaluationCriteria.synonyms.map(String)
					: [],
				examples: Array.isArray(req.body.evaluationCriteria.examples)
					? req.body.evaluationCriteria.examples.map(String)
					: []
			};
		}
		if (req.body?.isActive !== undefined) updates.isActive = Boolean(req.body.isActive);

		if (updates.name) {
			const catId = updates.categoryId || prev.categoryId;
			const dup = await getDb().collection('specifications').findOne({
				_id: { $ne: prev._id },
				categoryId: catId,
				name: updates.name
			});
			if (dup) return res.status(409).json({ error: 'Nombre duplicado en la categoría' });
		}

		const r = await getDb()
			.collection('specifications')
			.findOneAndUpdate({ _id: prev._id }, { $set: updates }, { returnDocument: 'after' });

		const tipo =
			req.body?.isActive === false
				? 'desactivacion'
				: req.body?.isActive === true && !prev.isActive
					? 'activacion'
					: 'edicion';
		await logChange({
			extractionKey: r.extractionKey,
			tipoCambio: tipo,
			valorAnterior: prev,
			valorNuevo: r
		});
		res.json(r);
	} catch (e) {
		next(e);
	}
});

router.post('/specs/:id/duplicate', async (req, res, next) => {
	try {
		const src = await getDb().collection('specifications').findOne({ _id: oid(req.params.id) });
		if (!src) return res.status(404).json({ error: 'Especificación no encontrada' });
		const name = String(req.body?.name || '').trim();
		if (!name) return res.status(400).json({ error: 'Debes asignar un nombre único' });
		const dup = await getDb().collection('specifications').findOne({
			categoryId: src.categoryId,
			name
		});
		if (dup) return res.status(409).json({ error: 'Nombre duplicado en la categoría' });

		const { _id, createdAt, updatedAt, ...rest } = src;
		const doc = {
			...rest,
			name,
			extractionKey: slug(name),
			createdAt: new Date(),
			updatedAt: new Date()
		};
		const r = await getDb().collection('specifications').insertOne(doc);
		await logChange({ extractionKey: doc.extractionKey, tipoCambio: 'duplicacion', valorNuevo: doc });
		res.status(201).json({ ...doc, _id: r.insertedId });
	} catch (e) {
		next(e);
	}
});

router.get('/validate', async (_req, res, next) => {
	try {
		const specs = await getDb().collection('specifications').find({}).toArray();
		const cats = await getDb().collection('categories').find({}).toArray();
		const units = await getDb().collection('units').find({}).toArray();
		const catMap = new Map(cats.map((c) => [String(c._id), c]));
		const unitMap = new Map(units.map((u) => [String(u._id), u]));
		const errors = [];

		for (const s of specs) {
			const issues = [];
			if (!s.name?.trim()) issues.push('sin nombre');
			if (!s.categoryId || !catMap.get(String(s.categoryId))) issues.push('sin categoría válida');
			if (s.requiresMeasurement && !s.unitId) issues.push('requiere unidad de medida');
			if (s.unitId && !unitMap.get(String(s.unitId))) issues.push('unidad inválida');
			if (!s.evaluationCriteria?.instructions?.trim()) issues.push('sin criterios de evaluación');
			if (issues.length) {
				errors.push({
					id: s._id,
					name: s.name,
					extractionKey: s.extractionKey,
					issues
				});
			}
		}
		res.json({
			ok: errors.length === 0,
			ready: errors.length === 0,
			total: specs.length,
			errorCount: errors.length,
			errors
		});
	} catch (e) {
		next(e);
	}
});

router.get('/changes', async (req, res, next) => {
	try {
		const q = {};
		if (req.query.key) q.especificacionClave = String(req.query.key);
		const items = await getDb()
			.collection('checklist_changes')
			.find(q)
			.sort({ changedAt: -1 })
			.limit(200)
			.toArray();
		res.json(items);
	} catch (e) {
		next(e);
	}
});

function slug(s) {
	return String(s)
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_|_$/g, '')
		.slice(0, 80);
}

export default router;
