/**
 * Comprueba que el MVP esté listo: solo falta (o no) la credencial Anthropic.
 *
 * Uso: pnpm check
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function loadEnv() {
	const envPath = path.join(root, '.env');
	if (!fs.existsSync(envPath)) return { exists: false };
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
	return { exists: true };
}

function ok(msg) {
	console.log(`  ✓ ${msg}`);
}
function warn(msg) {
	console.log(`  ! ${msg}`);
}
function fail(msg) {
	console.error(`  ✗ ${msg}`);
	process.exitCode = 1;
}

const env = loadEnv();
console.log('Check listo-para-credenciales · Extractor RFP Lintel\n');

const major = Number(process.versions.node.split('.')[0]);
const minor = Number(process.versions.node.split('.')[1]);
const patch = Number(process.versions.node.split('.')[2]);
const nodeOk =
	major > 24 || (major === 24 && (minor > 22 || (minor === 22 && patch >= 1)));
if (nodeOk) ok(`Node ${process.version} (≥ 24.22.1)`);
else fail(`Node ${process.version} — se requiere ≥ 24.22.1`);

if (!env.exists) fail('Falta archivo .env (copia .env.example)');
else ok('.env presente');

for (const k of ['MONGODB_URI', 'PORT', 'WEB_PORT', 'PUBLIC_API_URL', 'CORS_ORIGIN']) {
	if (process.env[k]?.trim()) ok(`${k} definido`);
	else fail(`${k} vacío o ausente en .env`);
}

const fixtures = ['rfp-demo.pdf', 'rfp-demo.docx', 'rfp-demo.doc', 'rfp-demo.xlsx', 'rfp-demo.xls'];
const fixDir = path.join(__dirname, 'fixtures');
const missing = fixtures.filter((f) => !fs.existsSync(path.join(fixDir, f)));
if (missing.length) fail(`Faltan fixtures: ${missing.join(', ')}`);
else ok(`fixtures demo (${fixtures.length})`);

const extract = spawnSync('node', [path.join(__dirname, 'validate-extract.mjs')], {
	cwd: root,
	encoding: 'utf8'
});
if (extract.status === 0) ok('validate:extract OK');
else fail('validate:extract falló — revisa extracción');

const PORT = Number(process.env.PORT) || 3052;
let health = null;
try {
	const res = await fetch(`http://127.0.0.1:${PORT}/api/health`);
	if (res.ok) health = await res.json();
} catch {
	/* API apagada */
}

if (health?.ok) {
	ok(`API en :${PORT} · claude.configured=${Boolean(health.claude?.configured)}`);
} else {
	warn(`API no responde en :${PORT} (arranca pnpm dev / pnpm dev:api para smoke)`);
}

const hasKey = Boolean(process.env.ANTHROPIC_API_KEY?.trim());
console.log('');
if (hasKey) {
	ok('ANTHROPIC_API_KEY presente en .env');
	console.log('\nSiguiente: con la API arriba → pnpm smoke');
} else {
	warn('ANTHROPIC_API_KEY vacío — única credencial pendiente para análisis IA');
	console.log(`
Pasos finales:
  1. Pon ANTHROPIC_API_KEY=sk-... en .env
  2. Reinicia la API (pnpm dev)
  3. pnpm smoke
`);
}

if (process.exitCode) {
	console.log('\nCheck con fallos — corrige antes de usar en serio.');
	process.exit(1);
}
console.log('\nCheck OK — MVP listo; solo depende de la key de Anthropic para el tramo Claude.');
