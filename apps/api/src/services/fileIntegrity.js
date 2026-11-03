import fs from 'node:fs';
import path from 'node:path';

const ALLOWED = {
	'.pdf': 'pdf',
	'.doc': 'word',
	'.docx': 'word',
	'.xls': 'excel',
	'.xlsx': 'excel'
};

export function allowedType(fileName) {
	const ext = path.extname(fileName || '').toLowerCase();
	return ALLOWED[ext] ? { ext, fileType: ALLOWED[ext] } : null;
}

/**
 * Comprueba extensión + cabecera mínima (dañado vs formato inválido).
 * No parsea el documento completo.
 */
export function checkFileIntegrity(absPath, originalName) {
	const typed = allowedType(originalName);
	if (!typed) {
		return {
			ok: false,
			code: 'FORMAT_INVALID',
			message: 'Formato no admitido. Usa PDF, Word (.doc/.docx) o Excel (.xls/.xlsx).'
		};
	}

	let stat;
	try {
		stat = fs.statSync(absPath);
	} catch {
		return { ok: false, code: 'FILE_CORRUPT', message: 'No se pudo leer el archivo (posible daño o carga incompleta).' };
	}

	if (!stat.size) {
		return { ok: false, code: 'FILE_CORRUPT', message: 'El archivo está vacío o dañado.' };
	}

	const fd = fs.openSync(absPath, 'r');
	const buf = Buffer.alloc(8);
	try {
		fs.readSync(fd, buf, 0, 8, 0);
	} finally {
		fs.closeSync(fd);
	}

	const { ext, fileType } = typed;
	let headerOk = false;

	if (ext === '.pdf') {
		headerOk = buf.slice(0, 4).toString('ascii') === '%PDF';
	} else if (ext === '.docx' || ext === '.xlsx') {
		// ZIP (Office Open XML)
		headerOk = buf[0] === 0x50 && buf[1] === 0x4b;
	} else if (ext === '.doc' || ext === '.xls') {
		// OLE Compound Document
		headerOk =
			buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0;
	}

	if (!headerOk) {
		return {
			ok: false,
			code: 'FILE_CORRUPT',
			message: `El archivo parece dañado o no es un ${fileType.toUpperCase()} válido (extensión ${ext} no coincide con el contenido).`
		};
	}

	return { ok: true, code: 'OK', fileType, ext };
}
