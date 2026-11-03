import { connectDb, getDb } from './db.js';
import { ensureIndexes } from './ensureIndexes.js';
import { releaseStaleAnalyses } from './services/analysisLock.js';

let ready;

/** Conexión + índices una vez por instancia serverless. */
export async function ensureApiReady() {
	if (ready) return ready;
	ready = (async () => {
		await connectDb();
		await releaseStaleAnalyses(getDb());
		await ensureIndexes(getDb());
		return true;
	})();
	return ready;
}
