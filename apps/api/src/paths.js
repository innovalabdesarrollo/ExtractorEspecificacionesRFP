import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function isVercel() {
	return Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
}

/** Disco local: apps/api/uploads · en Vercel: /tmp (efímero; el binario vive en Mongo). */
export function getUploadDir() {
	if (isVercel()) {
		const dir = path.join(os.tmpdir(), 'extractor-rfp-uploads');
		fs.mkdirSync(dir, { recursive: true });
		return dir;
	}
	const dir = path.join(__dirname, '../uploads');
	fs.mkdirSync(dir, { recursive: true });
	return dir;
}
