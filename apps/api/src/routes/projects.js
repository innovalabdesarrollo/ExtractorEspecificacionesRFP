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

router.get('/', async (req, res, next) => {
	try {
		const db = getDb();
		const q = {};
		const { project, client, from, to } = req.query;
		if (project) q.name = { $regex: String(project), $options: 'i' };
		if (client) q.clientName = { $regex: String(client), $options: 'i' };
		if (from || to) {
			q.createdAt = {};
			if (from) q.createdAt.$gte = new Date(String(from));
			if (to) q.createdAt.$lte = new Date(String(to));
		}
		const items = await db.collection('projects').find(q).sort({ createdAt: -1 }).toArray();
		res.json(items);
	} catch (e) {
		next(e);
	}
});

router.get('/:id', async (req, res, next) => {
	try {
		const item = await getDb().collection('projects').findOne({ _id: oid(req.params.id) });
		if (!item) return res.status(404).json({ error: 'Proyecto no encontrado' });
		res.json(item);
	} catch (e) {
		next(e);
	}
});

router.post('/', async (req, res, next) => {
	try {
		const name = String(req.body?.name || '').trim();
		const clientName = String(req.body?.clientName || '').trim();
		const description = String(req.body?.description || '').trim();
		if (!name || !clientName) {
			return res.status(400).json({ error: 'Proyecto y cliente son obligatorios' });
		}
		const doc = {
			name,
			clientName,
			description,
			status: 'activo',
			createdAt: new Date(),
			updatedAt: new Date()
		};
		const r = await getDb().collection('projects').insertOne(doc);
		res.status(201).json({ ...doc, _id: r.insertedId });
	} catch (e) {
		next(e);
	}
});

router.patch('/:id', async (req, res, next) => {
	try {
		const updates = { updatedAt: new Date() };
		for (const k of ['name', 'clientName', 'description', 'status']) {
			if (req.body?.[k] !== undefined) updates[k] = String(req.body[k]).trim();
		}
		if (updates.name === '' || updates.clientName === '') {
			return res.status(400).json({ error: 'Proyecto y cliente no pueden estar vacíos' });
		}
		const r = await getDb()
			.collection('projects')
			.findOneAndUpdate({ _id: oid(req.params.id) }, { $set: updates }, { returnDocument: 'after' });
		if (!r) return res.status(404).json({ error: 'Proyecto no encontrado' });
		res.json(r);
	} catch (e) {
		next(e);
	}
});

export default router;
