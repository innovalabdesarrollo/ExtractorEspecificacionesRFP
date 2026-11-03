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

router.get('/analysis/:analysisId', async (req, res, next) => {
	try {
		const items = await getDb()
			.collection('observations')
			.find({ analysisId: oid(req.params.analysisId) })
			.sort({ createdAt: -1 })
			.toArray();
		res.json(items);
	} catch (e) {
		next(e);
	}
});

router.post('/', async (req, res, next) => {
	try {
		const analysisId = req.body?.analysisId;
		const extractionKey = String(req.body?.extractionKey || '').trim();
		const comentario = String(req.body?.comentario || '').trim();
		const tipo = String(req.body?.tipo || 'aclaracion').trim();
		if (!analysisId || !extractionKey || !comentario) {
			return res.status(400).json({ error: 'analysisId, extractionKey y comentario son obligatorios' });
		}
		const analysis = await getDb().collection('analyses').findOne({ _id: oid(analysisId) });
		if (!analysis) return res.status(404).json({ error: 'Análisis no encontrado' });

		const analysisOid = oid(analysisId);
		const existing = await getDb().collection('observations').findOne({
			analysisId: analysisOid,
			extractionKey
		});

		let saved;
		if (existing) {
			saved = await getDb()
				.collection('observations')
				.findOneAndUpdate(
					{ _id: existing._id },
					{
						$set: {
							comentario,
							tipo,
							usuarioId: String(req.body?.usuarioId || existing.usuarioId || 'analista'),
							updatedAt: new Date()
						}
					},
					{ returnDocument: 'after' }
				);
		} else {
			const doc = {
				analysisId: analysisOid,
				projectId: analysis.projectId,
				extractionKey,
				comentario,
				tipo,
				usuarioId: String(req.body?.usuarioId || 'analista'),
				createdAt: new Date(),
				updatedAt: new Date()
			};
			const r = await getDb().collection('observations').insertOne(doc);
			saved = { ...doc, _id: r.insertedId };
		}

		await getDb().collection('analyses').updateOne(
			{ _id: analysis._id, 'findings.extractionKey': extractionKey },
			{ $set: { 'findings.$.observation': comentario } }
		);

		res.status(existing ? 200 : 201).json(saved);
	} catch (e) {
		next(e);
	}
});

router.patch('/:id', async (req, res, next) => {
	try {
		const updates = { updatedAt: new Date() };
		if (req.body?.comentario !== undefined) updates.comentario = String(req.body.comentario).trim();
		if (req.body?.tipo !== undefined) updates.tipo = String(req.body.tipo).trim();
		if (!updates.comentario) return res.status(400).json({ error: 'comentario no puede estar vacío' });

		const r = await getDb()
			.collection('observations')
			.findOneAndUpdate({ _id: oid(req.params.id) }, { $set: updates }, { returnDocument: 'after' });
		if (!r) return res.status(404).json({ error: 'Observación no encontrada' });

		await getDb().collection('analyses').updateOne(
			{ _id: r.analysisId, 'findings.extractionKey': r.extractionKey },
			{ $set: { 'findings.$.observation': r.comentario } }
		);
		res.json(r);
	} catch (e) {
		next(e);
	}
});

export default router;
