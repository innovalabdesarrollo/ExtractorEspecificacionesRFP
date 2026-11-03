import fs from 'node:fs';
import path from 'node:path';
import { getUploadDir } from '../paths.js';

const KEEP = new Set(['.gitkeep', '.gitignore']);

export const UPLOAD_DIR = getUploadDir();

/**
 * Elimina archivos en disco no referenciados en `files.storedName`.
 * Opcionalmente marca en Mongo docs cuyo archivo ya no existe (y sin content).
 */
export async function cleanupOrphanUploads(db, { fixMissingDocs = true } = {}) {
	const uploadDir = getUploadDir();
	fs.mkdirSync(uploadDir, { recursive: true });

	const docs = await db
		.collection('files')
		.find({}, { projection: { storedName: 1, content: 1 } })
		.toArray();
	const referenced = new Set(docs.map((d) => d.storedName).filter(Boolean));

	const onDisk = fs.readdirSync(uploadDir);
	let removedFiles = 0;
	const removedNames = [];

	for (const name of onDisk) {
		if (KEEP.has(name)) continue;
		if (referenced.has(name)) continue;
		const abs = path.join(uploadDir, name);
		try {
			const st = fs.statSync(abs);
			if (!st.isFile()) continue;
			fs.unlinkSync(abs);
			removedFiles += 1;
			removedNames.push(name);
		} catch {
			/* ignore */
		}
	}

	let markedMissing = 0;
	if (fixMissingDocs) {
		for (const d of docs) {
			if (!d.storedName) continue;
			if (d.content) continue;
			const abs = path.join(uploadDir, d.storedName);
			if (fs.existsSync(abs)) continue;
			const r = await db.collection('files').updateOne(
				{ _id: d._id, processingStatus: { $ne: 'archivo_faltante' } },
				{
					$set: {
						processingStatus: 'archivo_faltante',
						lastError: 'Archivo no encontrado en disco (huérfano / eliminado)'
					}
				}
			);
			if (r.modifiedCount) markedMissing += 1;
		}
	}

	return {
		removedFiles,
		removedNames,
		markedMissing,
		referenced: referenced.size,
		onDisk: onDisk.length
	};
}
