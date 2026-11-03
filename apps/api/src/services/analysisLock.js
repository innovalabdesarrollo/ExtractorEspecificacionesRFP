/** Minutos sin avance tras los cuales un análisis "procesando" se marca fallido. */
const STALE_MIN = Number(process.env.ANALYSIS_LOCK_STALE_MIN) || 45;

/**
 * Libera análisis atascados (proceso caído) para no bloquear el proyecto para siempre.
 * @param {import('mongodb').Db} db
 * @param {import('mongodb').ObjectId} [projectId]
 */
export async function releaseStaleAnalyses(db, projectId) {
	const cutoff = new Date(Date.now() - STALE_MIN * 60_000);
	const filter = {
		status: { $in: ['procesando', 'pendiente'] },
		startedAt: { $lt: cutoff }
	};
	if (projectId) filter.projectId = projectId;

	const r = await db.collection('analyses').updateMany(filter, {
		$set: {
			status: 'fallido',
			errorMessage:
				'Análisis interrumpido (excedió el tiempo máximo). Puedes volver a ejecutar el análisis.',
			completedAt: new Date(),
			progressPercentage: 100
		}
	});
	return r.modifiedCount || 0;
}

/** Análisis en curso del proyecto (si hay). */
export async function findRunningAnalysis(db, projectId) {
	return db.collection('analyses').findOne({
		projectId,
		status: { $in: ['procesando', 'pendiente'] }
	});
}
