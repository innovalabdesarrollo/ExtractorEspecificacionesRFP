import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { allowedType, checkFileIntegrity } from '../src/services/fileIntegrity.js';

const fixtures = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../scripts/fixtures');

describe('fileIntegrity', () => {
	it('acepta extensiones del MVP', () => {
		assert.equal(allowedType('a.pdf')?.fileType, 'pdf');
		assert.equal(allowedType('a.docx')?.fileType, 'word');
		assert.equal(allowedType('a.doc')?.fileType, 'word');
		assert.equal(allowedType('a.xlsx')?.fileType, 'excel');
		assert.equal(allowedType('a.xls')?.fileType, 'excel');
		assert.equal(allowedType('a.txt'), null);
	});

	it('rechaza formato inválido', () => {
		const tmp = path.join(os.tmpdir(), `rfp-bad-${Date.now()}.txt`);
		fs.writeFileSync(tmp, 'hola');
		const r = checkFileIntegrity(tmp, 'nota.txt');
		assert.equal(r.ok, false);
		assert.equal(r.code, 'FORMAT_INVALID');
		fs.unlinkSync(tmp);
	});

	it('rechaza PDF con cabecera falsa (FILE_CORRUPT)', () => {
		const tmp = path.join(os.tmpdir(), `rfp-fake-${Date.now()}.pdf`);
		fs.writeFileSync(tmp, 'not-a-pdf');
		const r = checkFileIntegrity(tmp, 'roto.pdf');
		assert.equal(r.ok, false);
		assert.equal(r.code, 'FILE_CORRUPT');
		fs.unlinkSync(tmp);
	});

	it('acepta fixture PDF real', () => {
		const p = path.join(fixtures, 'rfp-demo.pdf');
		const r = checkFileIntegrity(p, 'rfp-demo.pdf');
		assert.equal(r.ok, true);
		assert.equal(r.fileType, 'pdf');
	});
});
