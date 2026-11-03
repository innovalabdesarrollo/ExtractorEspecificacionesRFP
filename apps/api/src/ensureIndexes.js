/**
 * Índices idempotentes para consultas del MVP.
 * Se llama al arrancar la API (createIndex es seguro si ya existen).
 */
export async function ensureIndexes(db) {
	await Promise.all([
		db.collection('projects').createIndex({ createdAt: -1 }),
		db.collection('projects').createIndex({ name: 1 }),
		db.collection('projects').createIndex({ clientName: 1 }),

		db.collection('files').createIndex({ projectId: 1, uploadedAt: -1 }),

		db.collection('analyses').createIndex({ projectId: 1, startedAt: -1 }),
		db.collection('analyses').createIndex({ status: 1, startedAt: -1 }),
		// Un solo análisis en curso por proyecto (lock)
		db.collection('analyses').createIndex(
			{ projectId: 1 },
			{
				unique: true,
				name: 'uniq_project_analisis_en_curso',
				partialFilterExpression: { status: { $in: ['procesando', 'pendiente'] } }
			}
		),

		// Unicidad lógica en POST upsert; índice compuesto para lookup (sin unique por si hay datos legacy)
		db.collection('observations').createIndex({ analysisId: 1, extractionKey: 1 }),
		db.collection('observations').createIndex({ projectId: 1, createdAt: -1 }),

		db.collection('categories').createIndex({ displayOrder: 1 }),
		db.collection('categories').createIndex({ isActive: 1 }),

		db.collection('units').createIndex({ symbol: 1 }),
		db.collection('units').createIndex({ isActive: 1 }),

		db.collection('specifications').createIndex({ categoryId: 1, name: 1 }, { unique: true }),
		db.collection('specifications').createIndex({ extractionKey: 1 }),
		db.collection('specifications').createIndex({ isActive: 1, dataType: 1 }),

		db.collection('checklist_changes').createIndex({ changedAt: -1 }),
		db.collection('checklist_changes').createIndex({ especificacionClave: 1, changedAt: -1 })
	]);
}
