/**
 * Smoke E2E API: proyecto → upload PDF/Word/Excel → análisis → resultados.
 *
 * Requisitos:
 * - API corriendo en PORT del .env (default 3052)
 * - MONGODB_URI en .env
 * - ANTHROPIC_API_KEY en .env para el tramo Claude (si falta: preflight OK + SKIP del análisis IA)
 *
 * Uso: pnpm smoke   (desde la raíz del monorepo)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function loadEnv() {
	const envPath = path.join(root, '.env');
	if (!fs.existsSync(envPath)) return;
	for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
		const t = line.trim();
		if (!t || t.startsWith('#')) continue;
		const i = t.indexOf('=');
		if (i < 0) continue;
		const k = t.slice(0, i).trim();
		let v = t.slice(i + 1).trim();
		if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
			v = v.slice(1, -1);
		}
		if (process.env[k] === undefined) process.env[k] = v;
	}
}

loadEnv();

const PORT = Number(process.env.PORT) || 3052;
const BASE = `http://127.0.0.1:${PORT}`;
const FIXTURES = path.join(__dirname, 'fixtures');
const HAS_KEY = Boolean(process.env.ANTHROPIC_API_KEY?.trim());

function ok(msg) {
	console.log(`  ✓ ${msg}`);
}
function fail(msg) {
	console.error(`  ✗ ${msg}`);
	process.exitCode = 1;
}

async function api(pathname, options = {}) {
	const res = await fetch(`${BASE}${pathname}`, options);
	const ct = res.headers.get('content-type') || '';
	const body = ct.includes('json') ? await res.json() : await res.text();
	return { res, body };
}

async function sleep(ms) {
	await new Promise((r) => setTimeout(r, ms));
}

async function main() {
	console.log(`Smoke E2E → ${BASE}`);
	console.log(`Claude: ${HAS_KEY ? 'ANTHROPIC_API_KEY presente' : 'SIN key (solo preflight)'}`);

	const health = await api('/api/health').catch((e) => ({ res: null, body: e.message }));
	if (!health.res?.ok) {
		fail(`API no responde en ${BASE}. Arranca: pnpm dev:api`);
		console.error(health.body);
		process.exit(1);
	}
	ok(`health · Node ${health.body.node}`);

	const fixtures = [
		'rfp-demo.pdf',
		'rfp-demo.docx',
		'rfp-demo.doc',
		'rfp-demo.xlsx',
		'rfp-demo.xls'
	];
	for (const f of fixtures) {
		const p = path.join(FIXTURES, f);
		if (!fs.existsSync(p)) {
			fail(`Falta fixture ${f}`);
			process.exit(1);
		}
	}
	ok('fixtures PDF/Word(.doc/.docx)/Excel(.xls/.xlsx)');

	// corrupt vs format (integridad)
	const badFd = new FormData();
	badFd.append('files', new Blob(['not-a-pdf'], { type: 'application/pdf' }), 'roto.pdf');
	badFd.append('files', new Blob(['hola'], { type: 'text/plain' }), 'nota.txt');
	const projTmp = await api('/api/projects', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ name: `Smoke ${Date.now()}`, clientName: 'E2E Lintel' })
	});
	if (!projTmp.res.ok) {
		fail(`crear proyecto: ${JSON.stringify(projTmp.body)}`);
		process.exit(1);
	}
	const projectId = projTmp.body._id;
	ok(`proyecto ${projectId}`);

	const rej = await api(`/api/files/project/${projectId}`, { method: 'POST', body: badFd });
	const rejected = rej.body.rejected || [];
	const codes = rejected.map((r) => r.code).sort().join(',');
	if (codes.includes('FILE_CORRUPT') && codes.includes('FORMAT_INVALID')) {
		ok(`rechazos: FILE_CORRUPT + FORMAT_INVALID`);
	} else {
		fail(`esperaba FILE_CORRUPT y FORMAT_INVALID, got ${codes || JSON.stringify(rej.body)}`);
	}

	const fd = new FormData();
	for (const f of fixtures) {
		const buf = fs.readFileSync(path.join(FIXTURES, f));
		fd.append('files', new Blob([buf]), f);
	}
	const up = await api(`/api/files/project/${projectId}`, { method: 'POST', body: fd });
	if (!up.res.ok || !(up.body.accepted?.length >= fixtures.length)) {
		fail(`upload fixtures: ${JSON.stringify(up.body)}`);
		process.exit(1);
	}
	ok(`upload ${up.body.accepted.length} archivos`);

	if (!HAS_KEY) {
		console.log('\nSin ANTHROPIC_API_KEY → se probará análisis DEMO (no Claude).');
		const startDemo = await api(`/api/analyses/project/${projectId}`, { method: 'POST' });
		if (startDemo.res.status !== 202 && !startDemo.res.ok) {
			fail(`iniciar análisis DEMO: ${JSON.stringify(startDemo.body)}`);
			process.exit(1);
		}
		const demoId = startDemo.body._id;
		let demoFinal = null;
		for (let i = 0; i < 60; i++) {
			await sleep(1000);
			const g = await api(`/api/analyses/${demoId}`);
			if (g.body.status === 'completado' || g.body.status === 'fallido') {
				demoFinal = g.body;
				break;
			}
		}
		if (!demoFinal || demoFinal.status !== 'completado') {
			fail(`análisis DEMO no completó: ${demoFinal?.errorMessage || demoFinal?.status || 'timeout'}`);
			process.exit(1);
		}
		if (!demoFinal.demoMode) {
			fail('se esperaba demoMode=true sin API key');
			process.exit(1);
		}
		ok(`DEMO completado · findings=${demoFinal.findings?.length || 0} · avisa falta de API key`);
		console.log('\nPreflight + DEMO OK. Con ANTHROPIC_API_KEY: reinicia API y pnpm smoke (tramo Claude).');
		process.exit(0);
	}

	const start = await api(`/api/analyses/project/${projectId}`, { method: 'POST' });
	if (start.res.status !== 202 && !start.res.ok) {
		fail(`iniciar análisis: ${JSON.stringify(start.body)}`);
		process.exit(1);
	}
	const analysisId = start.body._id;
	ok(`análisis iniciado ${analysisId}`);

	let final = null;
	for (let i = 0; i < 90; i++) {
		await sleep(2000);
		const g = await api(`/api/analyses/${analysisId}`);
		const a = g.body;
		process.stdout.write(
			`\r  … ${a.status} ${a.progressPercentage ?? 0}% ${a.stage || ''}   `
		);
		if (a.status === 'completado' || a.status === 'fallido') {
			final = a;
			console.log('');
			break;
		}
	}

	if (!final) {
		fail('timeout esperando análisis');
		process.exit(1);
	}
	if (final.status !== 'completado') {
		fail(`análisis fallido: ${final.errorMessage || final.status}`);
		process.exit(1);
	}
	ok(`completado · findings=${final.findings?.length || 0} · adicionales=${final.additional?.length || 0}`);

	const found = (final.findings || []).filter((f) => f.status === 'encontrado');
	if (!found.length) {
		fail('ningún finding en estado encontrado (revisar prompt/fixtures)');
		process.exit(1);
	}
	ok(`al menos 1 especificación encontrada (${found.length})`);

	const exp = await api(`/api/analyses/${analysisId}/export?format=json`);
	if (!exp.res.ok) {
		fail('export json');
		process.exit(1);
	}
	ok('export JSON');

	console.log('\nSmoke E2E OK — flujo completo con Claude.');
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
