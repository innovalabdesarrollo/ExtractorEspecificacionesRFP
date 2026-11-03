import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { buildSimpleDocx } from './simpleDocx.js';

function safeName(s) {
	return String(s || 'export')
		.replace(/[^\w.\-áéíóúñÁÉÍÓÚÑ ]+/gi, '_')
		.slice(0, 60);
}

function linesFromPayload(payload) {
	const lines = [];
	lines.push(`Proyecto: ${payload.proyecto || '—'}`);
	lines.push(`Cliente: ${payload.cliente || '—'}`);
	lines.push(`Versión: ${payload.versionLabel || '—'}`);
	lines.push(
		`Fecha: ${payload.fecha ? new Date(payload.fecha).toLocaleString('es-MX') : '—'}`
	);
	lines.push('');
	if (payload.summary) {
		lines.push('Resumen:');
		lines.push(String(payload.summary));
		lines.push('');
	}

	const sections = [
		['Encontrados', payload.encontrados],
		['Faltantes', payload.faltantes],
		['Ambiguos / contradictorios', payload.ambiguos],
		['Adicionales', payload.adicionales]
	];

	for (const [title, items] of sections) {
		lines.push(`--- ${title} (${items?.length || 0}) ---`);
		if (!items?.length) {
			lines.push('(ninguno)');
			lines.push('');
			continue;
		}
		for (const it of items) {
			if (it.description && !it.name) {
				lines.push(
					`• ${it.description}${it.value ? ` = ${it.value}` : ''}${it.unit ? ` ${it.unit}` : ''}${it.sourceFile ? ` [${it.sourceFile}]` : ''}`
				);
			} else {
				lines.push(
					`• ${it.name || '—'} · ${it.status || ''}${it.value ? ` · ${it.value}` : ''}${it.unit ? ` ${it.unit}` : ''}${it.sourceFile ? ` · ${it.sourceFile}` : ''}`
				);
				if (it.evidence) lines.push(`  Evidencia: ${String(it.evidence).slice(0, 240)}`);
			}
		}
		lines.push('');
	}
	return lines;
}

export async function buildPdfBuffer(payload) {
	const doc = await PDFDocument.create();
	const font = await doc.embedFont(StandardFonts.Helvetica);
	const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
	const margin = 50;
	const fontSize = 10;
	const lineHeight = 14;
	let page = doc.addPage([612, 792]);
	let y = 742;

	const draw = (text, { bold = false, size = fontSize } = {}) => {
		const f = bold ? fontBold : font;
		const maxWidth = 612 - margin * 2;
		const words = String(text).split(/\s+/);
		let line = '';
		const flush = (t) => {
			if (y < margin + lineHeight) {
				page = doc.addPage([612, 792]);
				y = 742;
			}
			page.drawText(t, { x: margin, y, size, font: f, color: rgb(0.1, 0.1, 0.1) });
			y -= lineHeight;
		};
		for (const w of words) {
			const next = line ? `${line} ${w}` : w;
			if (f.widthOfTextAtSize(next, size) > maxWidth) {
				if (line) flush(line);
				line = w;
			} else {
				line = next;
			}
		}
		if (line) flush(line);
	};

	draw('Extractor RFP · Lintel — Resumen de requisitos', { bold: true, size: 12 });
	y -= 6;
	for (const line of linesFromPayload(payload)) {
		if (line.startsWith('---')) draw(line, { bold: true });
		else draw(line || ' ');
	}

	return Buffer.from(await doc.save());
}

export async function buildDocxBuffer(payload) {
	const paragraphs = [
		'Extractor RFP · Lintel — Resumen de requisitos',
		...linesFromPayload(payload)
	];
	return buildSimpleDocx(paragraphs);
}

export function exportFilename(projectName, ext) {
	return `rfp-${safeName(projectName)}.${ext}`;
}
