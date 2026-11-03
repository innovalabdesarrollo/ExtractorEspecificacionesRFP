import fs from 'node:fs';
import path from 'node:path';
import { Binary } from 'mongodb';
import { getUploadDir, isVercel } from '../paths.js';

/** En Vercel el FS es efímero: guarda el binario en Mongo junto al metadata. */
export function readFileBinary(absPath) {
	const buf = fs.readFileSync(absPath);
	return new Binary(buf);
}

/** Asegura archivo en disco local/tmp a partir del doc de Mongo. */
export function materializeFile(fileDoc) {
	const dir = getUploadDir();
	const abs = path.join(dir, fileDoc.storedName);
	if (fs.existsSync(abs) && fs.statSync(abs).size > 0) return abs;

	const raw = fileDoc.content;
	if (!raw) {
		if (!isVercel() && fs.existsSync(abs)) return abs;
		const e = new Error(`Archivo no disponible en almacenamiento: ${fileDoc.fileName}`);
		e.status = 404;
		throw e;
	}

	const buf = Buffer.isBuffer(raw)
		? raw
		: Buffer.from(raw.buffer || raw.value?.buffer || raw.value || raw);
	fs.writeFileSync(abs, buf);
	return abs;
}

export function shouldPersistContent() {
	return isVercel() || process.env.PERSIST_UPLOADS_IN_MONGO === '1';
}
