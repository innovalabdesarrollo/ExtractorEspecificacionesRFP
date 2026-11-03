import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractFileText } from '../src/services/extract.js';

const fixtures = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../scripts/fixtures');

const cases = [
	{ file: 'rfp-demo.pdf', type: 'pdf', marker: /--- Página \d+ ---/ },
	{ file: 'rfp-demo.docx', type: 'word' },
	{ file: 'rfp-demo.doc', type: 'word' },
	{ file: 'rfp-demo.xlsx', type: 'excel', marker: /--- Hoja:/ },
	{ file: 'rfp-demo.xls', type: 'excel', marker: /--- Hoja:/ }
];

describe('extractFileText', () => {
	for (const c of cases) {
		it(`extrae ${c.file}`, async () => {
			const abs = path.join(fixtures, c.file);
			const r = await extractFileText(abs, c.type, c.file);
			assert.equal(r.ok, true, r.error);
			assert.ok((r.text || '').trim().length > 20, 'texto corto');
			if (c.marker) assert.match(r.text, c.marker);
			assert.match(r.text, /12500|área|area|andenes|acero|HVAC/i);
		});
	}
});
