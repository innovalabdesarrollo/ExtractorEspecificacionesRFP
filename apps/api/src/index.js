import http from 'node:http';
import { connectDb, getDb, pingDb } from './db.js';
import { ensureIndexes } from './ensureIndexes.js';
import { cleanupOrphanUploads } from './services/cleanupUploads.js';
import { createApp } from './app.js';

const PORT = Number(process.env.PORT);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
	console.error('PORT inválido en .env — define PORT (ej. 3052) para esta app');
	process.exit(1);
}

await connectDb();
const dbInfo = await pingDb();
const { releaseStaleAnalyses } = await import('./services/analysisLock.js');
const staleReleased = await releaseStaleAnalyses(getDb());
await ensureIndexes(getDb());
const cleanup = await cleanupOrphanUploads(getDb());
console.log(
	`[ExtractorRFP] DB ok · ${dbInfo.dbName}${dbInfo.atlas ? ' (Atlas)' : ''} · índices OK · Node ${process.version}`
);
if (staleReleased) {
	console.log(`[ExtractorRFP] Liberados ${staleReleased} análisis atascados`);
}
if (cleanup.removedFiles || cleanup.markedMissing) {
	console.log(
		`[ExtractorRFP] Uploads: eliminados ${cleanup.removedFiles} huérfanos en disco` +
			(cleanup.markedMissing ? `, ${cleanup.markedMissing} docs sin archivo` : '')
	);
}

const app = createApp();
const server = http.createServer(app);

server.on('error', (err) => {
	if (err.code === 'EADDRINUSE') {
		console.error(
			`[ExtractorRFP] Puerto ${PORT} en uso por otro proceso. ` +
				`No se tocó ese proceso. Cambia PORT en .env a uno libre y alinea PUBLIC_API_URL.`
		);
		process.exit(1);
	}
	console.error(err);
	process.exit(1);
});

server.listen(PORT, '127.0.0.1', () => {
	console.log(`API ExtractorRFP en http://127.0.0.1:${PORT}`);
});
