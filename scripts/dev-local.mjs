/**
 * Arranque local estable: comprueba límite de FDs y lanza web+api en paralelo.
 * Uso: pnpm dev  →  node scripts/dev-local.mjs
 *
 * Si aparece EMFILE: `ulimit -n 65536` o `CHOKIDAR_USEPOLLING=1 pnpm dev`
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function softLimit() {
	try {
		const soft = Number(fs.readFileSync('/proc/self/limits', 'utf8').match(/Max open files\s+(\d+)/)?.[1]);
		return Number.isFinite(soft) ? soft : null;
	} catch {
		return null;
	}
}

const lim = softLimit();
if (lim != null && lim < 4096) {
	console.warn(
		`[ExtractorRFP] Límite de archivos abiertos bajo (${lim}). ` +
			`Si ves EMFILE: ejecuta \`ulimit -n 65536\` o \`CHOKIDAR_USEPOLLING=1 pnpm dev\`.`
	);
} else {
	console.log(`[ExtractorRFP] Dev local${lim != null ? ` · ulimit -n ${lim}` : ''}`);
}

const kids = [
	spawn('pnpm', ['--filter', '@extractor-rfp/api', 'dev'], {
		cwd: root,
		stdio: 'inherit',
		env: process.env
	}),
	spawn('pnpm', ['--filter', '@extractor-rfp/web', 'dev'], {
		cwd: root,
		stdio: 'inherit',
		env: process.env
	})
];

function shutdown(code = 0) {
	for (const k of kids) {
		try {
			k.kill('SIGTERM');
		} catch {
			/* ignore */
		}
	}
	process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

for (const k of kids) {
	k.on('exit', (code, signal) => {
		if (signal === 'SIGTERM' || signal === 'SIGINT') return;
		if (code && code !== 0) {
			console.error(`[ExtractorRFP] Proceso hijo salió con código ${code}`);
			shutdown(code);
		}
	});
}
