import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateWithClaude } from '../src/services/evaluate.js';

describe('evaluateWithClaude (guard)', () => {
	let prev;

	before(() => {
		prev = process.env.ANTHROPIC_API_KEY;
		delete process.env.ANTHROPIC_API_KEY;
	});

	after(() => {
		if (prev === undefined) delete process.env.ANTHROPIC_API_KEY;
		else process.env.ANTHROPIC_API_KEY = prev;
	});

	it('falla claro sin ANTHROPIC_API_KEY', async () => {
		await assert.rejects(
			() =>
				evaluateWithClaude({
					checklist: [{ extractionKey: 'x', name: 'X' }],
					documents: [{ fileName: 'a.pdf', text: 'hola', meta: { type: 'pdf' } }]
				}),
			(err) => {
				assert.match(String(err.message), /ANTHROPIC_API_KEY/);
				assert.equal(err.status, 500);
				return true;
			}
		);
	});
});
