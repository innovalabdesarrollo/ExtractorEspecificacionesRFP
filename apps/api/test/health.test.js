import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../src/app.js';

describe('GET /api/health', () => {
	it('responde ok y bandera claude.configured', async () => {
		const prev = process.env.ANTHROPIC_API_KEY;
		delete process.env.ANTHROPIC_API_KEY;

		const server = http.createServer(createApp());
		await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
		const { port } = server.address();

		try {
			const res = await fetch(`http://127.0.0.1:${port}/api/health`);
			assert.equal(res.status, 200);
			const body = await res.json();
			assert.equal(body.ok, true);
			assert.equal(body.service, 'extractor-rfp-api');
			assert.equal(body.claude.configured, false);
			assert.equal(body.claude.model, null);
		} finally {
			await new Promise((resolve) => server.close(resolve));
			if (prev === undefined) delete process.env.ANTHROPIC_API_KEY;
			else process.env.ANTHROPIC_API_KEY = prev;
		}
	});
});
