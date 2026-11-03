/**
 * Valida calidad de extracción (sin Claude) sobre fixtures.
 *
 * - Siempre: scripts/fixtures/rfp-demo.*
 * - Opcional: coloca RFPs reales Lintel en scripts/fixtures/lintel/ y vuelve a correr
 *
 * Uso: pnpm validate:extract
 * Con ANTHROPIC_API_KEY + API arriba: también comprueba findings mínimos del demo vía smoke (pnpm smoke).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const fixturesDir = path.join(__dirname, 'fixtures');
const lintelDir = path.join(fixturesDir, 'lintel');
const reportDir = path.join(__dirname, 'reports');

const extractUrl = pathToFileURL(
	path.join(root, 'apps/api/src/services/extract.js')
).href;
const { extractFileText } = await import(extractUrl);

function ok(msg) {
	console.log(`  ✓ ${msg}`);
}
function fail(msg) {
	console.error(`  ✗ ${msg}`);
	process.exitCode = 1;
}

function guessType(name) {
	const ext = path.extname(name).toLowerCase();
	if (ext === '.pdf') return 'pdf';
	if (ext === '.doc' || ext === '.docx') return 'word';
	if (ext === '.xls' || ext === '.xlsx') return 'excel';
	return null;
}

function collectFiles(dir) {
	if (!fs.existsSync(dir)) return [];
	return fs
		.readdirSync(dir)
		.filter((f) => !f.startsWith('.') && guessType(f))
		.map((f) => path.join(dir, f));
}

async function checkOne(absPath) {
	const fileName = path.basename(absPath);
	const fileType = guessType(fileName);
	const result = await extractFileText(absPath, fileType, fileName);
	const issues = [];
	if (!result.ok) issues.push(result.error || 'extracción fallida');
	const text = result.text || '';
	if (text.trim().length < 20) issues.push('texto demasiado corto');
	if (fileType === 'pdf' && !/--- Página \d+ ---/.test(text)) {
		issues.push('PDF sin marcadores de página');
	}
	if (fileType === 'excel' && !/--- Hoja:/.test(text)) {
		issues.push('Excel sin marcadores de hoja');
	}
	if (/12500|área|area|andenes|HVAC|acero/i.test(text) === false && fileName.startsWith('rfp-demo')) {
		issues.push('demo sin keywords esperadas');
	}
	return {
		fileName,
		fileType,
		ok: issues.length === 0,
		issues,
		chars: text.length,
		meta: result.meta || null,
		preview: text.slice(0, 120).replace(/\s+/g, ' ')
	};
}

async function main() {
	console.log('Validación de extracción');
	const demo = collectFiles(fixturesDir).filter((p) => path.basename(p).startsWith('rfp-demo'));
	const lintel = collectFiles(lintelDir);
	const all = [...demo, ...lintel];

	if (!demo.length) {
		fail('No hay fixtures rfp-demo.*');
		process.exit(1);
	}

	const rows = [];
	for (const f of all) {
		const row = await checkOne(f);
		rows.push(row);
		if (row.ok) ok(`${row.fileName} · ${row.chars} chars · ${row.fileType}`);
		else fail(`${row.fileName}: ${row.issues.join('; ')}`);
	}

	if (!lintel.length) {
		console.log(
			'  · Sin RFPs Lintel aún. Coloca PDF/Word/Excel en scripts/fixtures/lintel/ y re-ejecuta.'
		);
	} else {
		ok(`${lintel.length} archivo(s) en fixtures/lintel/`);
	}

	fs.mkdirSync(reportDir, { recursive: true });
	const reportPath = path.join(reportDir, 'extract-quality.json');
	fs.writeFileSync(
		reportPath,
		JSON.stringify(
			{
				at: new Date().toISOString(),
				tz: 'America/Mexico_City',
				demoCount: demo.length,
				lintelCount: lintel.length,
				passed: rows.filter((r) => r.ok).length,
				failed: rows.filter((r) => !r.ok).length,
				rows
			},
			null,
			2
		)
	);
	console.log(`Reporte: ${path.relative(root, reportPath)}`);

	if (process.exitCode) process.exit(1);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
