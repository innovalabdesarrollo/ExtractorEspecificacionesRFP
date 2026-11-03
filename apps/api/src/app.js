import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import projectsRouter from './routes/projects.js';
import filesRouter from './routes/files.js';
import checklistRouter from './routes/checklist.js';
import analysesRouter from './routes/analyses.js';
import observationsRouter from './routes/observations.js';
import { getDb } from './db.js';
import { getUploadDir, isVercel } from './paths.js';
import { materializeFile } from './services/fileStore.js';

function corsOrigins() {
	const raw = (process.env.CORS_ORIGIN || 'http://localhost:5192,http://127.0.0.1:5192')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
	const allowed = new Set();
	for (const o of raw) {
		allowed.add(o.replace(/\/$/, ''));
		try {
			const u = new URL(o);
			if (u.hostname === 'localhost') {
				u.hostname = '127.0.0.1';
				allowed.add(u.origin);
			} else if (u.hostname === '127.0.0.1') {
				u.hostname = 'localhost';
				allowed.add(u.origin);
			}
		} catch {
			/* ignore */
		}
	}
	if (process.env.VERCEL_URL) {
		allowed.add(`https://${process.env.VERCEL_URL}`);
	}
	if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
		allowed.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
	}
	return [...allowed];
}

export function createApp() {
	const app = express();
	const allowed = corsOrigins();

	app.use(
		cors({
			origin(origin, cb) {
				if (!origin || allowed.includes(origin) || isVercel()) return cb(null, true);
				return cb(null, false);
			}
		})
	);
	app.use(express.json({ limit: '2mb' }));
	app.use('/uploads', express.static(getUploadDir()));

	// Fallback: servir desde Mongo si el archivo no está en disco (Vercel)
	app.get('/uploads/:storedName', async (req, res, next) => {
		try {
			const abs = path.join(getUploadDir(), req.params.storedName);
			if (fs.existsSync(abs)) return res.sendFile(abs);
			const file = await getDb().collection('files').findOne({ storedName: req.params.storedName });
			if (!file) return res.status(404).json({ error: 'Archivo no encontrado' });
			const materialized = materializeFile(file);
			res.type(file.mimeType || 'application/octet-stream');
			res.sendFile(materialized);
		} catch (e) {
			next(e);
		}
	});

	app.get('/api/health', (_req, res) => {
		const claudeConfigured = Boolean(process.env.ANTHROPIC_API_KEY?.trim());
		res.json({
			ok: true,
			service: 'extractor-rfp-api',
			port: Number(process.env.PORT) || null,
			node: process.version,
			vercel: isVercel(),
			claude: {
				configured: claudeConfigured,
				model: claudeConfigured ? process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514' : null
			}
		});
	});

	app.use('/api/projects', projectsRouter);
	app.use('/api/files', filesRouter);
	app.use('/api/checklist', checklistRouter);
	app.use('/api/analyses', analysesRouter);
	app.use('/api/observations', observationsRouter);

	app.use((err, _req, res, _next) => {
		console.error(err);
		res.status(err.status || 500).json({ error: err.message || 'Error interno' });
	});

	return app;
}
