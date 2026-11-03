import { Router } from 'express';
import { ObjectId } from 'mongodb';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { getDb } from '../db.js';
import { getUploadDir } from '../paths.js';
import { checkFileIntegrity } from '../services/fileIntegrity.js';
import { readFileBinary, shouldPersistContent } from '../services/fileStore.js';

const router = Router();

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => cb(null, getUploadDir()),
	filename: (_req, file, cb) => {
		const safe = file.originalname.replace(/[^\w.\-áéíóúñÁÉÍÓÚÑ ]+/g, '_');
		cb(null, `${Date.now()}-${safe}`);
	}
});

const upload = multer({
	storage,
	limits: { fileSize: 25 * 1024 * 1024 }
});

function oid(id) {
	if (!ObjectId.isValid(id)) {
		const e = new Error('ID inválido');
		e.status = 400;
		throw e;
	}
	return new ObjectId(id);
}

function unlinkQuiet(abs) {
	try {
		if (fs.existsSync(abs)) fs.unlinkSync(abs);
	} catch {
		/* ignore */
	}
}

function multerMessage(err) {
	if (err instanceof multer.MulterError) {
		if (err.code === 'LIMIT_FILE_SIZE') {
			return 'Archivo demasiado grande (máx. 25 MB).';
		}
		if (err.code === 'LIMIT_FILE_COUNT') {
			return 'Demasiados archivos (máx. 20 por carga).';
		}
		return `Error de carga: ${err.message}`;
	}
	return err.message || 'Error al subir archivos';
}

router.get('/project/:projectId', async (req, res, next) => {
	try {
		const items = await getDb()
			.collection('files')
			.find({ projectId: oid(req.params.projectId) })
			.project({ content: 0 })
			.sort({ uploadedAt: -1 })
			.toArray();
		res.json(items);
	} catch (e) {
		next(e);
	}
});

router.post('/project/:projectId', (req, res, next) => {
	upload.array('files', 20)(req, res, async (err) => {
		if (err) {
			return res.status(400).json({
				error: multerMessage(err),
				code: err instanceof multer.MulterError ? err.code : 'UPLOAD_ERROR',
				accepted: [],
				rejected: []
			});
		}
		try {
			const projectId = oid(req.params.projectId);
			const project = await getDb().collection('projects').findOne({ _id: projectId });
			if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

			const acceptedDocs = [];
			const rejected = [];
			const persist = shouldPersistContent();

			for (const f of req.files || []) {
				const abs = path.join(getUploadDir(), f.filename);
				const check = checkFileIntegrity(abs, f.originalname);
				if (!check.ok) {
					unlinkQuiet(abs);
					rejected.push({
						fileName: f.originalname,
						code: check.code,
						reason: check.message
					});
					continue;
				}
				const doc = {
					projectId,
					fileName: f.originalname,
					storedName: f.filename,
					fileType: check.fileType,
					mimeType: f.mimetype,
					size: f.size,
					fileUrl: `/uploads/${f.filename}`,
					processingStatus: 'pendiente',
					lastError: null,
					uploadedAt: new Date()
				};
				if (persist) {
					doc.content = readFileBinary(abs);
				}
				acceptedDocs.push(doc);
			}

			let inserted = [];
			if (acceptedDocs.length) {
				const r = await getDb().collection('files').insertMany(acceptedDocs);
				inserted = acceptedDocs.map((d, i) => {
					const { content: _c, ...rest } = d;
					return { ...rest, _id: r.insertedIds[i] };
				});
			}

			if (!inserted.length && !rejected.length) {
				return res.status(400).json({
					error: 'No se recibieron archivos',
					code: 'NO_FILES',
					accepted: [],
					rejected: []
				});
			}

			if (!inserted.length && rejected.length) {
				return res.status(400).json({
					error: 'Ningún archivo fue aceptado',
					code: 'ALL_REJECTED',
					accepted: [],
					rejected
				});
			}

			res.status(201).json({ accepted: inserted, rejected });
		} catch (e) {
			next(e);
		}
	});
});

router.delete('/:id', async (req, res, next) => {
	try {
		const file = await getDb().collection('files').findOne({ _id: oid(req.params.id) });
		if (!file) return res.status(404).json({ error: 'Archivo no encontrado' });
		const abs = path.join(getUploadDir(), file.storedName);
		unlinkQuiet(abs);
		await getDb().collection('files').deleteOne({ _id: file._id });
		res.json({ ok: true });
	} catch (e) {
		next(e);
	}
});

export default router;
